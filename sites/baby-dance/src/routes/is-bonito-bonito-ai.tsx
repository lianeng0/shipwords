import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { Faq, type FaqItem, faqJsonLd, GuidePage, Table } from '~/site/guide';
import { breadcrumbs, organization, updatedDate } from '~/site/product';
import { Sources } from '~/site/sources';
import site from '../../site.config';

// Targets "is bonito bonito ai", "bonito bonito es ia", "who sings bonito bonito". The question is asked in two
// different senses (the song, the baby videos), so the page answers both and shows the platform labels people can
// check themselves. Nothing here is inferred: the sources are the Spotify persona tag, the YouTube AI label and the
// songwriter's own interviews (El Tiempo, La FM, El Comercio).

const PATH = '/is-bonito-bonito-ai';

const SPLIT: [string, string, string][] = [
  ['The lyrics', 'A person', 'Written by Anier Cruz Revilla, who is credited as writer and composer'],
  ['The melody', 'AI, directed', 'Generated with AI tools, then arranged by the writer'],
  ['The voice', 'AI', 'There is no human singer on the record'],
  ['The face', 'AI', 'The performer is a generated persona, described in the profile as a digital artist'],
  ['The release', 'A person', 'Published 3 August 2026 under the name Thiago Navarro Music'],
  ['The baby video', 'AI video', 'A video model swaps the baby in the reference clip for your photo'],
];

const TIMELINE: [string, string][] = [
  ['3 August 2026', 'Release date reported by El Comercio for the original EP.'],
  ['25 September 2026', 'El Colombiano reports on the AI artist and quotes the creator.'],
  ['21–22 October 2026', 'El Comercio reports on the production process and the Río Roma collaboration.'],
];

const faq = (): FaqItem[] => [
  { q: m.isai_faq1_q(), a: m.isai_faq1_a() },
  { q: m.isai_faq2_q(), a: m.isai_faq2_a() },
  { q: m.isai_faq3_q(), a: m.isai_faq3_a() },
  { q: m.isai_faq4_q(), a: m.isai_faq4_a() },
];

export const Route = createFileRoute('/is-bonito-bonito-ai')({
  head: () =>
    pageHead(site, {
      title: m.isai_meta_title(),
      description: m.isai_meta_description(),
      path: PATH,
      image: `${site.url}/media/og-home.jpg`,
      jsonLd: [
        {
          '@type': 'Article',
          headline: m.isai_title(),
          description: m.isai_meta_description(),
          datePublished: '2026-10-31',
          dateModified: updatedDate,
          author: organization,
          publisher: organization,
          image: `${site.url}/media/og-home.jpg`,
          citation: [
            'https://www.elcolombiano.com/amp/tendencias/bonito-bonito-historia-creador-cancion-viral-tiktok-inteligencia-artificial-GF41556033',
          ],
          mainEntityOfPage: `${site.url}${PATH}`,
        },
        breadcrumbs(PATH, m.isai_title()),
        faqJsonLd(faq()),
      ],
    }),
  component: IsAiPage,
});

function IsAiPage() {
  return (
    <GuidePage
      path={PATH}
      title={m.isai_title()}
      intro={
        <>
          <p className="lead">{m.isai_intro()}</p>
          <p>
            {m.isai_split_text()} <Link to="/thiago-navarro">{m.tn_nav_title()}</Link>
          </p>
        </>
      }
    >
      <h2>{m.isai_split_heading()}</h2>
      <Table head={['Part', 'Made by', 'Detail']} rows={SPLIT} />

      <h2>{m.isai_evidence_heading()}</h2>
      <p>{m.isai_evidence_text()}</p>
      <p>{m.isai_evidence_text2()}</p>

      <h2>{m.isai_timeline_heading()}</h2>
      <p>{m.isai_timeline_text()}</p>
      <Table head={['Date', 'What happened']} rows={TIMELINE} />

      <h2>{m.isai_rio_heading()}</h2>
      <p>{m.isai_rio_text()}</p>

      <h2>{m.isai_video_heading()}</h2>
      <p>{m.isai_video_text()}</p>
      <p>{m.isai_video_text2()}</p>

      <Sources />
      <Faq title={m.isai_faq_title()} items={faq()} />
    </GuidePage>
  );
}
