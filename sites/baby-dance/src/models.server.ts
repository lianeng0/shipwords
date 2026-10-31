import { serverModels } from '@shipwords/jobs/models';
import catalog from '../site.models';

// Server only: never import this file from pages or components.
//
// Both entries are the same job: take the viral Bonito Bonito clip as reference, replace the baby in it with the
// uploaded photo, and put the original song back over the result. The model never writes the routine and never
// supplies the music, so what the visitor gets is the trend they already saw on TikTok, with their own baby in it.
//
// Reference assets (R2, uploaded at launch):
//   assets/baby-dance/source-12s.mp4  0.0–12.0 s of the trend (720x1280, 30 fps, with the song)
//   assets/baby-dance/source-5s.mp4   15.0–20.0 s, the hands-on-cheeks / hands-on-hips / hands-up part
//   assets/baby-dance/song-12s.m4a    the same audio track, cut to match
//   assets/baby-dance/song-5s.m4a

/** Face centres measured with YuNet on each clip's own frames (fractions of width and height). */
const FACE_12S = [0.489, 0.475] as const;
// The 5 s cut starts mid-turn, so the first frame is a poor detection; 2 s in the face is centred and large.
const FACE_5S = [0.401, 0.512, 2] as const;

// The check has two judges. SFace similarity alone cannot carry this site: two different babies score 0.51–0.74 and the
// same baby repainted scores 0.79–0.82, so no threshold separates a swap from a missed swap. The face-box pixel
// difference can: an untouched clip scores 0, a repaint about 23, a different baby about 59 — hence minChange: 10.

const CLIP_12S = 'assets/baby-dance/source-12s.mp4';
const CLIP_5S = 'assets/baby-dance/source-5s.mp4';

/**
 * Edit @video_1 (written as Reference it becomes reference-to-video). Kling 4.0 names images @image_1 and rejects
 * the wrong name, so @image1 from the engine is rewritten. Audio is kept in the prompt as a belt-and-braces measure;
 * compose replaces it with the clean track anyway because Yir always turns audio generation on for this model.
 */
function swapPrompt(images: Readonly<Record<string, string>>) {
  const target = Object.values(images)[0]!.replace(/^@image(\d+)$/, '@image_$1');
  return [
    'Edit @video_1.',
    `Replace the baby in the video with the baby in ${target}.`,
    "The replacement keeps the original baby's position, pose, head direction, gestures, facial expressions and mouth movements frame by frame, and wears the clothes from the photo.",
    'The face, hair, skin tone and age must match the photo exactly, with the same body proportions.',
    'Only one baby appears in the video: do not add another person or animal.',
    'Keep everything else unchanged: the room, the floor, the wall, the camera framing, the camera movement, the lighting, the timing and the video duration.',
    'Keep the audio exactly identical to the original video. Do not add any new sounds.',
  ].join(' ');
}

export default serverModels(catalog, {
  'baby-dance': {
    upstream: 'yir',
    upstreamModel: 'klingai/kling-4.0',
    // Quoted at $3.528 for 12 s at 720p (reference mode bills per output second, ~$0.294/s); cap leaves headroom
    // for a channel failover. A failed swap still refunds.
    maxCost: '3.80',
    timeoutMinutes: 30,
    effect: {
      segments: [
        {
          id: 'full',
          referenceVideo: CLIP_12S,
          slots: ['baby'],
          prompt: swapPrompt,
          // generate_audio can only be on with Yir; compose swaps the original song back in.
          parameters: { duration: 12, resolution: '720p', aspect_ratio: 'auto' },
          maxCost: '3.80',
          target: 12,
          base: CLIP_12S,
          check: { original: CLIP_12S, faces: { baby: FACE_12S }, maxSimilarity: 0.45, minChange: 10 },
        },
      ],
      compose: {
        audio: 'assets/baby-dance/song-12s.m4a',
        audioStart: 0,
        audioDuration: 12,
        width: 720,
        height: 1280,
        fps: 30,
      },
    },
  },
  'baby-dance-preview': {
    upstream: 'yir',
    // Kling 4.0 is the only model Yir can actually price for reference_video: Seedance 2.0 and Mini both quote
    // complete_price_unavailable, and with them unavailable the cheap 5 s tier no longer exists. It quotes $2.94 for
    // 5 s / 720p but billed $0.7605 (Yir billing, settled 2026-10-31), so one sign-up bonus pays for a real swap.
    upstreamModel: 'klingai/kling-4.0',
    maxCost: '3.20',
    timeoutMinutes: 20,
    effect: {
      segments: [
        {
          id: 'full',
          referenceVideo: CLIP_5S,
          slots: ['baby'],
          prompt: swapPrompt,
          // Kling 4.0 reference mode rejects 'auto' image values but wants 'auto' here, and generate_audio is true-only.
          parameters: { duration: 5, resolution: '720p', aspect_ratio: 'auto', generate_audio: true },
          maxCost: '3.20',
          target: 5,
          base: CLIP_5S,
          check: { original: CLIP_5S, faces: { baby: FACE_5S }, maxSimilarity: 0.45, minChange: 10 },
        },
      ],
      compose: {
        audio: 'assets/baby-dance/song-5s.m4a',
        audioStart: 0,
        audioDuration: 5,
        width: 720,
        height: 1280,
        fps: 30,
      },
    },
  },
});
