import { analyticsScripts } from '@shipwords/core/analytics';
import { captureAttribution } from '@shipwords/core/react/attribution';
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import { analyticsPreferenceScript } from '~/lib/analytics-preferences';
import { authClient } from '~/lib/auth';
import { getPublicConfig } from '~/lib/public-config';
import { identify } from '~/lib/track';
import { m } from '~/paraglide/messages.js';
import { getLocale, setLocale } from '~/paraglide/runtime.js';
import { AccountDialog, AccountLink } from '~/site/account';
import { GUIDES } from '~/site/guide';
import { SUPPORT_EMAIL } from '~/site/legal';
import { PricingDialog, PricingLink } from '~/site/pricing';
import { organization } from '~/site/product';
import { openSignIn, promptGoogleOneTap, SignInDialog } from '~/site/sign-in';
import appCss from '~/site/styles.css?url';
import site from '../../site.config';

export const Route = createRootRoute({
  loader: () => getPublicConfig(),
  head: ({ loaderData }) => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [
      { rel: 'stylesheet', href: appCss },
      // Preloaded because the first screen is type-heavy: the hero heading is set in this file, and swapping a variable
      // font in after the first paint is a visible jump on a phone.
      {
        rel: 'preload',
        href: '/fonts/nunito-latin-wght-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    // Analytics scripts are skipped in local dev so dev traffic stays out of reports.
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({ '@context': 'https://schema.org', ...organization }),
      },
      ...(import.meta.env.DEV || !loaderData?.analyticsEnabled
        ? []
        : [{ children: analyticsPreferenceScript }, ...analyticsScripts(site)]),
    ],
  }),
  shellComponent: Document,
  component: Layout,
  notFoundComponent: NotFound,
});

// 404: React 19 hoists title and meta into head. Lists the main entry points; each site adds its own pages.
function NotFound() {
  return (
    <section className="legal">
      <title>{m.common_not_found_title({ name: site.name })}</title>
      <meta name="robots" content="noindex" />
      <h1>{m.common_not_found_heading()}</h1>
      <p>{m.common_not_found_intro()}</p>
      <ul>
        <li>
          <Link to="/">{m.common_not_found_home()}</Link>
        </li>
        <li>
          <a href="/#pricing">{m.common_nav_pricing()}</a>
        </li>
      </ul>
    </section>
  );
}

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang={getLocale()}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Layout() {
  const config = Route.useLoaderData();
  const auth = authClient(config.googleClientId);
  const session = auth.useSession();
  const user = session.data?.user;

  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    // Show Google One Tap when signed out; skipped when Google is not configured.
    if (session.isPending || session.data || !config.googleClientId) return;
    promptGoogleOneTap(config.googleClientId);
  }, [session.isPending, session.data, config.googleClientId]);

  useEffect(() => {
    if (user?.id) identify(user.id);
  }, [user?.id]);

  return (
    <div className="page">
      <header className="site-header">
        <Link to="/" className="brand">
          {site.name}
        </Link>
        <nav>
          <PricingLink source="nav">{m.common_nav_pricing()}</PricingLink>
          {import.meta.env.DEV && <LocaleToggle />}
          {user ? (
            <AccountLink className="avatar" title={user.email}>
              {user.image ? (
                <img src={user.image} alt="" referrerPolicy="no-referrer" />
              ) : (
                (user.name || user.email).slice(0, 1).toUpperCase()
              )}
            </AccountLink>
          ) : (
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                openSignIn();
              }}
            >
              {m.common_nav_sign_in()}
            </a>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>{m.common_footer_notice({ year: new Date().getFullYear(), name: site.name })}</span>
        <nav>
          <Link to="/about">About</Link>
          <Link to="/privacy">{m.common_footer_privacy()}</Link>
          <Link to="/terms">{m.common_footer_terms()}</Link>
          <Link to="/refunds">{m.common_footer_refunds()}</Link>
          <Link to="/dmca">{m.common_footer_dmca()}</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{m.common_footer_contact()}</a>
        </nav>
        {/* Guides sit on their own row: they are the long-tail entry points, and burying them in the policy links is
            what leaves those pages with no internal links at all. */}
        <nav className="footer-guides" aria-label={m.guide_more_label()}>
          {GUIDES.map((guide) => (
            <Link key={guide.path} to={guide.path}>
              {guide.title()}
            </Link>
          ))}
        </nav>
      </footer>
      <SignInDialog />
      <PricingDialog />
      <AccountDialog />
    </div>
  );
}

// For local review: the header globe toggles en/zh (sets a cookie and reloads). Production is English only; DEV is false in builds so this never renders.
// Dev-only, so styles are inline rather than in styles.css.
function LocaleToggle() {
  const zh = getLocale() === 'zh';
  const label = zh ? 'Switch to English' : 'Switch to Chinese';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setLocale(zh ? 'en' : 'zh')}
      style={{
        padding: '0.2rem 0.6rem',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'inherit',
      }}
    >
      {zh ? 'ZH' : 'EN'}
    </button>
  );
}
