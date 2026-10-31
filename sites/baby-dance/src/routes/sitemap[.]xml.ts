import { sitemapXml } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import site from '../../site.config';

// Register new indexable pages here. Guides are the four long-tail pages in src/routes; keep this list in step with them.
export const PAGES = [
  '/',
  '/bonito-bonito-lyrics-english',
  '/is-bonito-bonito-ai',
  '/thiago-navarro',
  '/bonito-bonito-without-capcut',
  '/privacy',
  '/terms',
  '/refunds',
  '/dmca',
];

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        sitemapXml(
          site,
          // lastmod is honoured by Google for crawl scheduling, as long as it is honest — this is the day the copy shipped.
          PAGES.map((path) => ({ path, lastmod: '2026-10-31' })),
        ),
    },
  },
});
