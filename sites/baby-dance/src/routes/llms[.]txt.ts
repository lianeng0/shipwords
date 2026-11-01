import { llmsTxt } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { GUIDES } from '~/site/guide';
import { freeConditions, priceSummary } from '~/site/product';
import site from '../../site.config';

// Optional summary for systems that use it; ordinary HTML remains the authoritative content.
export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () =>
        llmsTxt(
          site,
          `Bonito Bonito AI baby dance generator: one baby photo becomes a vertical MP4 with the original routine and song, no watermark and no CapCut. ${freeConditions()} Full videos: ${priceSummary()}.`,
          [
            {
              title: 'Bonito Bonito AI baby dance generator',
              path: '/',
              description: 'The photo upload tool, product details, prices and FAQ.',
            },
            ...GUIDES.map((guide) => ({
              title: guide.title(),
              path: guide.path,
              description: guide.description(),
            })),
            { title: 'Pricing', path: '/#pricing', description: priceSummary() },
            {
              title: 'About and editorial approach',
              path: '/about',
              description: 'Publishing responsibility, corrections and contact.',
            },
            {
              title: 'Privacy',
              path: '/privacy',
              description: 'Photo processing, retention and removal requests.',
            },
          ],
        ),
    },
  },
});
