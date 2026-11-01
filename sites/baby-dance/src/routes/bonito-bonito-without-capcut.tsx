import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { Faq, type FaqItem, faqJsonLd, GuidePage, Table } from '~/site/guide';
import { formatPrice } from '~/site/pricing';
import { fullCredits } from '~/site/product';
import { Sources } from '~/site/sources';
import site from '../../site.config';

// Targets "bonito bonito without capcut", "bonito bonito baby video no watermark", "bonito bonito ai baby template".
// Comparison page: it says plainly when the free template is the right answer, because a page that pretends a paid
// tool always wins reads like an ad and converts worse.

const PATH = '/bonito-bonito-without-capcut';

// Ten videos is not a config value: the 10-pack carries 300 credits and a 12 s video costs 30, so the pack price splits
// into ten. Kept here rather than in the copy so a price change in site.config.ts cannot leave the table stale.
const PACK = site.products[2];
const PACK_EACH = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: PACK.price.currency,
}).format(PACK.price.amount / 100 / (PACK.credits / fullCredits));

const LIMITS = [
  'Photo requirements, framing and motion depend on the template you choose.',
  'Length and resolution depend on the template and available export settings.',
  'Check the export screen for watermark options and any paid assets.',
  'Check music permissions for the platform and use you have in mind.',
];
const COMPARE: [string, string, string][] = [
  ['Input', 'Depends on the template', 'One uploaded photo'],
  ['Audio', 'Check the selected sound', 'The original track, laid back on the render'],
  ['Length', 'Check the selected template', '5 or 12 seconds, your choice'],
  ['Resolution', 'Check export settings', '720 × 1280, 30 fps'],
  ['Watermark', 'Check export settings and paid assets', 'None'],
  ['The file', 'Export from CapCut', 'MP4 download'],
  [
    'Price',
    'Check the template and export options',
    `${formatPrice(site.products[0])} for 12 s, ${PACK_EACH} each in the 10-pack`,
  ],
];

const faq = (): FaqItem[] => [
  { q: m.nc_faq1_q(), a: m.nc_faq1_a() },
  { q: m.nc_faq2_q(), a: m.nc_faq2_a() },
  { q: m.nc_faq3_q(), a: m.nc_faq3_a() },
  { q: m.nc_faq4_q(), a: m.nc_faq4_a() },
];

export const Route = createFileRoute('/bonito-bonito-without-capcut')({
  head: () =>
    pageHead(site, {
      title: m.nc_meta_title(),
      description: m.nc_meta_description(),
      path: PATH,
      image: `${site.url}/media/og-home.jpg`,
      jsonLd: [
        {
          '@type': 'HowTo',
          name: m.nc_title(),
          description: m.nc_meta_description(),
          totalTime: 'PT3M',
          step: [
            {
              '@type': 'HowToStep',
              name: 'Upload one photo',
              text: 'Face forward, even light, no sunglasses.',
            },
            {
              '@type': 'HowToStep',
              name: 'Pick a length',
              text: '5 seconds free with the sign-up credits, or 12 seconds.',
            },
            {
              '@type': 'HowToStep',
              name: 'Download the MP4',
              text: '720 × 1280, original song, no watermark.',
            },
          ],
        },
        faqJsonLd(faq()),
      ],
    }),
  component: NoCapcutPage,
});

function NoCapcutPage() {
  return (
    <GuidePage
      path={PATH}
      title={m.nc_title()}
      intro={
        <>
          <p className="lead">{m.nc_intro()}</p>
          <p>
            {m.nc_when_text()} <Link to="/bonito-bonito-lyrics-english">{m.lyr_nav_title()}</Link>
          </p>
        </>
      }
    >
      <h2>{m.nc_limits_heading()}</h2>
      <p>{m.nc_limits_text()}</p>
      <ul>
        {LIMITS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{m.nc_compare_heading()}</h2>
      <p>{m.nc_compare_text()}</p>
      <Table head={['Decision', 'CapCut template', 'This tool']} rows={COMPARE} />

      <h2>{m.nc_how_heading()}</h2>
      <p>{m.nc_how_text()}</p>
      <p>{m.nc_how_text2()}</p>

      <h2>{m.nc_quality_heading()}</h2>
      <p>{m.nc_quality_text()}</p>
      <p>{m.nc_quality_text2()}</p>

      <Sources items={['capcut']} />
      <Faq title={m.nc_faq_title()} items={faq()} />
    </GuidePage>
  );
}
