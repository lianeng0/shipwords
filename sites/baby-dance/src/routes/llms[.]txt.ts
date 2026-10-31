import { llmsTxt } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { GUIDES } from '~/site/guide';
import site from '../../site.config';

// llms.txt: the one-page summary AI answers reach for. The tool first, then the guides, because the guides are what
// cited answers quote (what the song says, who sings it, whether any of it is AI).
export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () =>
        llmsTxt(
          site,
          "Bonito Bonito AI baby dance generator: turn one photo of a baby into the viral Bonito Bonito dance video, with the original routine and the original song. Vertical 720x1280 MP4, no watermark, no CapCut. 12 seconds for $6.99; the 5-second AI baby dancing video preview is free with the sign-up credits.",
          [
            {
              title: 'Bonito Bonito AI baby dance video generator',
              path: '/',
              description:
                'Upload one baby photo and get the 5-second or 12-second trend video with the original audio, plus what the cafecito and un cafecito riquito moves are.',
            },
            ...GUIDES.map((guide) => ({
              title: guide.title(),
              path: guide.path,
              description: guide.description(),
            })),
            {
              title: 'Pricing',
              path: '/#pricing',
              description: '$6.99 for one 12-second video, $18.99 for three, $55.99 for ten.',
            },
          ],
        ),
    },
  },
});
