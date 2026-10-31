import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Faq, type FaqItem, faqJsonLd, GuidePage, Table } from '~/site/guide';
import { m } from '~/paraglide/messages.js';
import { formatPrice } from '~/site/pricing';
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
}).format(PACK.price.amount / 100 / 10);

const LIMITS = [
  "Face: the template drops your photo into a fixed slot, so framing, head size and lighting are whatever the template decided.",
  'Length: usually one fixed cut, and that cut can change when the template is updated.',
  'Export: a watermark unless you pay for the app, at whatever resolution the template ships.',
  'Audio: borrowed from the platform, which is fine to post there and awkward anywhere else.',
  'Reruns: if the render looks wrong you re-run the whole template, not the shot you dislike.',
];

const COMPARE: [string, string, string][] = [
  ['Your baby', 'A fixed photo slot, framed by the template', 'Your uploaded photo, matched frame by frame'],
  ['Audio', 'Platform sound', 'The original track, laid back on the render'],
  ['Length', 'Whatever the template ships', '5 or 12 seconds, your choice'],
  ['Resolution', "The template's", '720 × 1280, 30 fps'],
  ['Watermark', 'Unless you pay for the app', 'None'],
  ['The file', 'Lives in the app until you export it', 'MP4 download, use it anywhere'],
  ['Price', 'Free', `${formatPrice(site.products[0])} for 12 s, ${PACK_EACH} each in the 10-pack`],
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
            { '@type': 'HowToStep', name: 'Upload one photo', text: 'Face forward, even light, no sunglasses.' },
            { '@type': 'HowToStep', name: 'Pick a length', text: '5 seconds free with the sign-up credits, or 12 seconds.' },
            { '@type': 'HowToStep', name: 'Download the MP4', text: '720 × 1280, original song, no watermark.' },
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

      <Faq title={m.nc_faq_title()} items={faq()} />
    </GuidePage>
  );
}
