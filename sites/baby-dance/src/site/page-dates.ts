// Record substantive page changes individually, rather than bumping every sitemap entry on deploy.
const modified: Record<string, string> = {
  '/': '2026-11-05',
  '/bonito-bonito-lyrics-english': '2026-11-05',
  '/thiago-navarro': '2026-11-05',
  '/is-bonito-bonito-ai': '2026-11-05',
};

export function pageModified(path: string): string {
  return modified[path] ?? '2026-11-01';
}
