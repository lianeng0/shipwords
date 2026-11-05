import { sitemapXml } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { GUIDES } from '~/site/guide';
import { pageModified } from '~/site/page-dates';
import site from '../../site.config';
export const PAGES = [
  { path: '/', lastmod: pageModified('/') },
  { path: '/about', lastmod: pageModified('/about') },
  ...GUIDES.map((guide) => ({ path: guide.path, lastmod: pageModified(guide.path) })),
  { path: '/privacy', lastmod: pageModified('/privacy') },
  ...['/terms', '/refunds', '/dmca'].map((path) => ({ path, lastmod: '2026-10-31' })),
];
export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: () => sitemapXml(site, PAGES) } },
});
