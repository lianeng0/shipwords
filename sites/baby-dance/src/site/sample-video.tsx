import { useEffect, useRef } from 'react';
import { track } from '~/lib/track';
import { posters } from './posters';

/** Keep source URLs in SSR HTML for discovery; only the hero autoplays. */
export function SampleVideo({ clip, label, hero = false }: { clip: string; label: string; hero?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const automatic = useRef(false);
  const manual = useRef(false);
  const autoplayTracked = useRef(false);
  const milestones = useRef(new Set<number>());
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (!entry.isIntersecting) video.pause();
      else if (hero && !reducedMotion.matches && !document.hidden && video.paused) {
        automatic.current = true;
        void video.play().catch(() => {
          automatic.current = false;
        });
      }
    });
    observer.observe(video);
    const onVisibility = () => {
      if (document.hidden) video.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hero]);
  return (
    <video
      ref={ref}
      src={`/media/${clip}.mp4`}
      poster={posters[clip] ?? `/media/${clip}.jpg`}
      {...(!hero ? { loading: 'lazy' } : {})}
      width={720}
      height={1280}
      muted={hero}
      loop={hero}
      playsInline
      controls
      preload="none"
      aria-label={label}
      onPointerDown={() => {
        automatic.current = false;
      }}
      onKeyDown={() => {
        automatic.current = false;
      }}
      onPlay={() => {
        if (automatic.current) {
          automatic.current = false;
          manual.current = false;
          if (!autoplayTracked.current) track('sample_autoplay', { clip });
          autoplayTracked.current = true;
        } else {
          manual.current = true;
          track('sample_play', { clip });
        }
      }}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (!manual.current || !Number.isFinite(video.duration) || video.duration <= 0) return;
        const percent = (video.currentTime / video.duration) * 100;
        for (const milestone of [25, 50, 75]) {
          if (percent < milestone || milestones.current.has(milestone)) continue;
          milestones.current.add(milestone);
          track('sample_progress', { clip, percent: milestone });
        }
      }}
    />
  );
}
