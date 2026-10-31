import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Faq, type FaqItem, faqJsonLd, GuidePage, Table } from '~/site/guide';
import { m } from '~/paraglide/messages.js';
import site from '../../site.config';

// Targets "thiago navarro", "who is thiago navarro", "thiago navarro bonito bonito singer". A name query, so the page
// is a short, sourced profile: what is known, what is disputed (nationality), and what does not exist (a live act).

const PATH = '/thiago-navarro';

const FACTS: [string, string][] = [
  ['Name', 'Thiago Navarro — releases as Thiago Navarro Music'],
  ['Type', 'Virtual music artist, built with AI tools, described in the profile as a digital artist'],
  ['Created by', 'Anier Cruz Revilla, credited as writer and composer'],
  ['Earlier release', 'Quédate con lo sencillo'],
  ['Breakout single', 'Bonito, Bonito, released 3 August 2026'],
  ['Platform labels', 'Spotify: AI Persona. YouTube: created with AI'],
  [
    'Reach, late September 2026',
    'More than 8.3 million views on the official video and about 1.5 million monthly listeners, per El Tiempo',
  ],
  ['Live shows', 'None'],
];

const faq = (): FaqItem[] => [
  { q: m.tn_faq1_q(), a: m.tn_faq1_a() },
  { q: m.tn_faq2_q(), a: m.tn_faq2_a() },
  { q: m.tn_faq3_q(), a: m.tn_faq3_a() },
  { q: m.tn_faq4_q(), a: m.tn_faq4_a() },
];

export const Route = createFileRoute('/thiago-navarro')({
  head: () =>
    pageHead(site, {
      title: m.tn_meta_title(),
      description: m.tn_meta_description(),
      path: PATH,
      image: `${site.url}/media/og-home.jpg`,
      jsonLd: [
        {
          '@type': 'Article',
          headline: m.tn_title(),
          description: m.tn_meta_description(),
          datePublished: '2026-10-31',
          dateModified: '2026-10-31',
          author: { '@type': 'Organization', name: site.name },
          publisher: { '@type': 'Organization', name: site.name },
          mainEntityOfPage: `${site.url}${PATH}`,
        },
        faqJsonLd(faq()),
      ],
    }),
  component: ThiagoPage,
});

function ThiagoPage() {
  return (
    <GuidePage
      path={PATH}
      title={m.tn_title()}
      intro={
        <>
          <p className="lead">{m.tn_intro()}</p>
          <p>
            {m.tn_facts_text()} <Link to="/is-bonito-bonito-ai">{m.isai_nav_title()}</Link>
          </p>
        </>
      }
    >
      <h2>{m.tn_who_heading()}</h2>
      <p>{m.tn_who_text()}</p>

      <h2>{m.tn_facts_heading()}</h2>
      <Table head={['Item', 'Detail']} rows={FACTS} />

      <h2>{m.tn_concert_heading()}</h2>
      <p>{m.tn_concert_text()}</p>

      <h2>{m.tn_earlier_heading()}</h2>
      <p>{m.tn_earlier_text()}</p>

      <h2>{m.tn_trend_heading()}</h2>
      <p>{m.tn_trend_text()}</p>
      <p>{m.tn_trend_text2()}</p>

      <Faq title={m.tn_faq_title()} items={faq()} />
    </GuidePage>
  );
}
