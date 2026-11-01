import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { m } from '~/paraglide/messages.js';
import { freeConditions, priceSummary } from './product';

// Shared by the four guide pages (lyrics, is-it-AI, Thiago Navarro, without CapCut). Each page answers one question
// people actually search for around the trend, and links to the others: that is the internal-link ring that makes a
// single-keyword site look like a small topic site instead of one landing page. Register a new guide in GUIDES and
// sitemap.xml + llms.txt pick it up.

// Claims on these pages are sourced (El Tiempo, La FM, El Comercio, platform labels). When a fact changes, update the
// date here as well so the pages do not advertise a stale check.
export const CHECKED = '1 November 2026';

export const GUIDES = [
  {
    path: '/baby-dance-photo-guide',
    title: () => 'Baby dance photo and privacy guide',
    description: () => 'Choose a photo, understand storage, and request removal.',
  },
  {
    path: '/baby-dance-example',
    title: () => 'Watch a real baby dance output',
    description: () => 'An existing 5-second output with verified file details.',
  },
  {
    path: '/bonito-bonito-lyrics-english',
    title: m.lyr_nav_title,
    description: m.lyr_nav_desc,
  },
  {
    path: '/is-bonito-bonito-ai',
    title: m.isai_nav_title,
    description: m.isai_nav_desc,
  },
  {
    path: '/thiago-navarro',
    title: m.tn_nav_title,
    description: m.tn_nav_desc,
  },
  {
    path: '/bonito-bonito-without-capcut',
    title: m.nc_nav_title,
    description: m.nc_nav_desc,
  },
] as const;

export interface FaqItem {
  q: string;
  a: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function Faq({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <div className="faq">
      <h2>{title}</h2>
      {items.map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** A two- or three-column fact table. Rows are data, so they live next to the page rather than in messages. */
export function Table({ head, rows }: { head: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((cell, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: header cells are positional and never reorder.
              <th key={index}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])}>
              {row.map((cell, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: table cells are positional and never reorder.
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuidePage({
  path,
  title,
  intro,
  children,
}: {
  path: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="sheet guide">
      <p className="kicker">{m.guide_kicker()}</p>
      <h1>{title}</h1>
      <p className="mono">{m.guide_updated({ date: CHECKED })}</p>
      <p>
        By <Link to="/about">Baby Dance AI editorial team</Link>
      </p>
      <div className="guide-intro">{intro}</div>
      {children}
      <div className="guide-cta">
        <a className="button primary" href="/#make">
          {m.guide_cta()}
        </a>
        <span className="muted">{m.guide_cta_note({ conditions: freeConditions() })}</span>
      </div>
      <nav className="guide-more" aria-label={m.guide_more_label()}>
        <h2>{m.guide_more_heading()}</h2>
        <ul>
          {GUIDES.filter((guide) => guide.path !== path).map((guide) => (
            <li key={guide.path}>
              <Link to={guide.path}>{guide.title()}</Link>
              <span className="muted"> — {guide.description()}</span>
            </li>
          ))}
          <li>
            <a href="/#pricing">{m.guide_pricing_link()}</a>
            <span className="muted"> — {m.guide_pricing_description({ offers: priceSummary() })}</span>
          </li>
        </ul>
      </nav>
    </article>
  );
}
