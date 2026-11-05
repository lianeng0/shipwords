import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { Faq, type FaqItem, faqJsonLd, GuidePage, Table } from '~/site/guide';
import { pageModified } from '~/site/page-dates';
import { breadcrumbs, organization } from '~/site/product';
import { Sources } from '~/site/sources';
import site from '../../site.config';

// Targets "bonito bonito lyrics english", "bonito bonito lyrics meaning", "un cafecito riquito meaning".
// The lyrics themselves are copyrighted, so this page explains the lines and the structure instead of reprinting them,
// which is also what the query actually wants: most people search for the words to find out what they mean.

const PATH = '/bonito-bonito-lyrics-english';

const FACTS = [
  ['Song', 'Bonito, Bonito'],
  ['Performer', 'Thiago Navarro Music'],
  ['Released', '3 August 2026'],
  ['Writer and composer', 'Anier Cruz Revilla'],
  [
    'Performer status',
    'AI persona — Spotify labels the profile AI Persona, YouTube marks the video as created with AI',
  ],
  ['First wave', 'Latin America and Spain, August–September 2026'],
];

// The phrases that are actually audible in the clips, in song order, with the gesture the trend uses for each.
const LINES: [string, string, string][] = [
  ['Bonito, bonito', 'Lovely, lovely', 'Both hands up, the hook'],
  ['Un cafecito', 'A little coffee', 'Mime a sip'],
  ['Riquito, riquito', 'So tasty, so tasty', 'Rub the belly'],
  ['Una sonrisita', 'A little smile', 'Fingers under the chin'],
  ['Bonita, bonita', 'So pretty, so pretty', 'Frame the face'],
  ['Un abracito', 'A little hug', 'Arms crossed on the chest'],
  ['Calientito, calientito', 'So warm, so warm', 'Hug yourself tighter'],
  ['Una llamadita', 'A little phone call', 'Hand to the ear'],
  ['Un rayito de sol', 'A little ray of sunshine', 'Hands open overhead'],
  ['Brillantito, brillantito', 'So bright, so bright', 'Fingers spread, sparkle'],
  ['Un paseíto', 'A little walk', 'Two fingers walking'],
  ['Sabrosito, sabrosito', 'So delightful, so delightful', 'Shoulders loose, sway'],
  ['Un gracias sincero', 'A heartfelt thank you', 'Hand on the heart'],
  ['Una cancioncita', 'A little song', 'Air microphone'],
  ['Qué bonito vivir', 'How lovely it is to live', 'Arms wide'],
  ['Pasito a pasito', 'Step by step', 'Small steps in place'],
  ['Lo importante es no dejar de caminar', 'The important thing is not to stop walking', 'Point forward'],
];

const faq = (): FaqItem[] => [
  { q: m.lyr_faq1_q(), a: m.lyr_faq1_a() },
  { q: m.lyr_faq2_q(), a: m.lyr_faq2_a() },
  { q: m.lyr_faq3_q(), a: m.lyr_faq3_a() },
  { q: m.lyr_faq4_q(), a: m.lyr_faq4_a() },
];

export const Route = createFileRoute('/bonito-bonito-lyrics-english')({
  head: () =>
    pageHead(site, {
      title: m.lyr_meta_title(),
      description: m.lyr_meta_description(),
      path: PATH,
      image: `${site.url}/media/og-home.jpg`,
      jsonLd: [
        {
          '@type': 'Article',
          headline: m.lyr_title(),
          description: m.lyr_meta_description(),
          datePublished: '2026-10-31',
          dateModified: pageModified(PATH),
          author: organization,
          publisher: organization,
          image: `${site.url}/media/og-home.jpg`,
          citation: [
            'https://www.elcolombiano.com/amp/tendencias/bonito-bonito-historia-creador-cancion-viral-tiktok-inteligencia-artificial-GF41556033',
          ],
          mainEntityOfPage: `${site.url}${PATH}`,
        },
        breadcrumbs(PATH, m.lyr_title()),
        faqJsonLd(faq()),
      ],
    }),
  component: LyricsPage,
});

function LyricsPage() {
  return (
    <GuidePage
      path={PATH}
      title={m.lyr_title()}
      intro={
        <>
          <p className="lead">{m.lyr_intro()}</p>
          <p>{m.lyr_intro2()}</p>
        </>
      }
    >
      <h2>{m.lyr_facts_heading()}</h2>
      <Table head={['Fact', 'Detail']} rows={FACTS} />
      <p>{m.lyr_facts_text()}</p>
      <p>
        {m.lyr_artist_link_intro()} <Link to="/thiago-navarro">{m.tn_nav_title()}</Link>.
      </p>

      <h2>{m.lyr_structure_heading()}</h2>
      <p>{m.lyr_structure_text()}</p>
      <p>{m.lyr_structure_text2()}</p>

      <h2>{m.lyr_lines_heading()}</h2>
      <p>{m.lyr_lines_text()}</p>
      <Table head={['Spanish line', 'English meaning', 'The move']} rows={LINES} />

      <h2>{m.lyr_meaning_heading()}</h2>
      <p>{m.lyr_meaning_text()}</p>
      <p>{m.lyr_meaning_text2()}</p>

      <h2>{m.lyr_copyright_heading()}</h2>
      <p>{m.lyr_copyright_text()}</p>

      <h2>{m.lyr_menino_heading()}</h2>
      <p>{m.lyr_menino_text()}</p>

      <h2>{m.lyr_use_heading()}</h2>
      <p>{m.lyr_use_text()}</p>
      <p>{m.lyr_use_text2()}</p>

      <Sources />
      <Faq title={m.lyr_faq_title()} items={faq()} />
    </GuidePage>
  );
}
