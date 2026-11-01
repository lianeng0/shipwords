import { useEffect, useRef } from 'react';
import { track } from '~/lib/track';

/** Keep source URLs in SSR HTML for discovery; only the hero autoplays. */
export function SampleVideo({ clip, label, hero = false }: { clip: string; label: string; hero?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (!entry.isIntersecting) video.pause();
      else if (hero && !reducedMotion.matches && !document.hidden) void video.play().catch(() => {});
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
      poster={`/media/${clip}.jpg`}
      width={720}
      height={1280}
      muted={hero}
      loop={hero}
      playsInline
      controls
      preload={hero ? 'metadata' : 'none'}
      aria-label={label}
      onPlay={() => track('sample_play', { clip })}
    />
  );
}
