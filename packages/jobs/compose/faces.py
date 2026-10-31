"""Swap check: is the original person still in the model output?

Usage: python3 faces.py <output.mp4> <original.mp4> <seconds> '<[[x, y] or [x, y, t], ...]>'
For each point (a face center in the original as fractions of width and height, read from the frame at t seconds, the first frame
when t is omitted) prints a JSON object with two lists in the same order:

  similarity — the highest cosine similarity between that original face and any face in 16 frames spread over the first `seconds`
               of the output. A missed swap of an adult scores 0.85+; a swapped adult stays under 0.4.
  change     — the mean absolute pixel difference (0–255, grayscale) between the original's face box and the same box in those
               frames. An untouched frame scores 0; a repaint that keeps the same person scores about 20; a different person
               scores about 60.

Two judges because the recognizer fails on some subjects: SFace has so little training data on babies that two different
babies score 0.51–0.74 and one baby repainted scores 0.79–0.82, so no similarity threshold separates them. The pixel
difference still does, and it answers the question the check actually asks: did the model redraw this person at all?

Models: OpenCV Zoo YuNet (detection) and SFace (recognition), baked into the image under /app/models.
"""
import json
import os
import sys

import cv2

MODELS = os.environ.get('FACE_MODELS', '/app/models')
# At least 16 frames, and 2 per second for long clips: a whole-clip edit can keep the original person for just a second or two.
SAMPLES = 16
SAMPLES_PER_SECOND = 2
# Box around the detected face, as a fraction of its width and height: far enough out to include the hairline, ears and chin,
# so a swap that only redraws the middle of the face still moves the score.
BOX_PADDING = 0.35
# How far a face may sit from the configured point and still be treated as that person (fractions of the frame).
NEAREST_RADIUS = 0.15
detector = cv2.FaceDetectorYN.create(f'{MODELS}/yunet.onnx', '', (320, 320), 0.6)
recognizer = cv2.FaceRecognizerSF.create(f'{MODELS}/sface.onnx', '')


def box_of(face, width, height):
    """Padded (x0, y0, x1, y1) of a detection, clipped to the frame."""
    x, y, w, h = face[0], face[1], face[2], face[3]
    return (
        max(0, int(x - w * BOX_PADDING)),
        max(0, int(y - h * BOX_PADDING)),
        min(width, int(x + w * (1 + BOX_PADDING))),
        min(height, int(y + h * (1 + BOX_PADDING))),
    )


def detect(image):
    """(center x, center y, box, row) for each face that isn't tiny (posters and photos on the shelves don't count)."""
    height, width = image.shape[:2]
    detector.setInputSize((width, height))
    _, found = detector.detect(image)
    result = []
    for face in found if found is not None else []:
        if face[2] * face[3] < 0.003 * width * height:
            continue
        result.append(((face[0] + face[2] / 2) / width, (face[1] + face[3] / 2) / height, box_of(face, width, height), face))
    return result


def faces(image):
    """Same as detect(), with the SFace feature of each face instead of the raw row."""
    return [
        (x, y, box, recognizer.feature(recognizer.alignCrop(image, row)))
        for x, y, box, row in detect(image)
    ]


def frames(path, seconds, count):
    capture = cv2.VideoCapture(path)
    end = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = capture.get(cv2.CAP_PROP_FPS)
    if fps > 0:
        end = min(end, int(seconds * fps))
    result = []
    for i in range(count):
        capture.set(cv2.CAP_PROP_POS_FRAMES, int(end * (i + 0.5) / count))
        ok, image = capture.read()
        if ok:
            result.append(image)
    return result


def original_frame(path, seconds):
    capture = cv2.VideoCapture(path)
    if seconds > 0:
        capture.set(cv2.CAP_PROP_POS_MSEC, seconds * 1000)
    ok, image = capture.read()
    if not ok:
        raise SystemExit(f'cannot read the original clip at {seconds}s')
    return image


def gray(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def change_of(point, original_frames, sampled):
    """Mean absolute grayscale difference of the face box, frame against its counterpart in the original (0 = untouched).

    Both clips are sampled at the same points in time, so each pair is the same moment: the box is detected afresh in the
    original frame, where the face is by definition where the original person put it. Comparing against one reference frame
    instead would count the person's own movement as a change.
    """
    values = []
    for reference, image in zip(original_frames, sampled):
        height, width = reference.shape[:2]
        if image.shape[:2] != (height, width):
            image = cv2.resize(image, (width, height))
        found = detect(reference)
        nearest = min(found, key=lambda f: (f[0] - point[0]) ** 2 + (f[1] - point[1]) ** 2, default=None)
        if not nearest:
            continue
        x0, y0, x1, y1 = nearest[2]
        values.append(float(cv2.absdiff(gray(reference)[y0:y1, x0:x1], gray(image)[y0:y1, x0:x1]).mean()))
    return round(sum(values) / len(values), 1) if values else 0.0


def main():
    output, original, seconds, points = sys.argv[1], sys.argv[2], float(sys.argv[3]), json.loads(sys.argv[4])
    by_time = {}
    targets = []
    for point in points:
        x, y = point[0], point[1]
        t = point[2] if len(point) > 2 else 0.0
        if t not in by_time:
            frame = original_frame(original, t)
            by_time[t] = (frame, faces(frame))
        frame, originals = by_time[t]
        nearest = min(originals, key=lambda f: (f[0] - x) ** 2 + (f[1] - y) ** 2, default=None)
        # Only trust a face that is actually near the configured point.
        if nearest and (nearest[0] - x) ** 2 + (nearest[1] - y) ** 2 < NEAREST_RADIUS**2:
            targets.append((nearest[3], [point[0], point[1]]))
        else:
            targets.append(None)
    count = max(SAMPLES, round(seconds * SAMPLES_PER_SECOND))
    sampled = frames(output, seconds, count)
    if not sampled:
        raise SystemExit('cannot read the output')
    original_frames = frames(original, seconds, count)
    found = [face[3] for image in sampled for face in faces(image)]
    similarity = []
    change = []
    for target in targets:
        if target is None:
            similarity.append(0.0)
            change.append(0.0)
            continue
        feature, point = target
        best = max((recognizer.match(feature, other, cv2.FaceRecognizerSF_FR_COSINE) for other in found), default=0.0)
        similarity.append(round(max(0.0, float(best)), 3))
        change.append(change_of(point, original_frames, sampled))
    print(json.dumps({'similarity': similarity, 'change': change}))


if __name__ == '__main__':
    main()
