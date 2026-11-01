import { sitemapXml } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { GUIDES } from '~/site/guide';
import { updatedDate } from '~/site/product';
import site from '../../site.config';
export const PAGES = [
  { path: '/', lastmod: updatedDate },
  { path: '/about', lastmod: updatedDate },
  ...GUIDES.map((guide) => ({ path: guide.path, lastmod: updatedDate })),
  { path: '/privacy', lastmod: updatedDate },
  ...['/terms', '/refunds', '/dmca'].map((path) => ({ path, lastmod: '2026-10-31' })),
];
export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: () => sitemapXml(site, PAGES) } },
});
