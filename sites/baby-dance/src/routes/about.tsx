import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { SUPPORT_EMAIL } from '~/site/legal';
import { organization } from '~/site/product';
import site from '../../site.config';

export const Route = createFileRoute('/about')({
  head: () =>
    pageHead(site, {
      title: 'About Baby Dance AI and our editorial approach',
      description:
        'What Baby Dance AI does, how we source our guides, and how to contact us about corrections or your photos.',
      path: '/about',
      jsonLd: [organization],
    }),
  component: AboutPage,
});
function AboutPage() {
  return (
    <article className="sheet guide">
      <h1>About Baby Dance AI</h1>
      <p>
        Baby Dance AI is an independent photo-to-video tool for the Bonito Bonito baby dance. It offers a
        short preview and a paid full video through your browser.
      </p>
      <h2>Who publishes these guides</h2>
      <p>
        The Baby Dance AI editorial team publishes this site's product instructions and trend explainers.
        Organization bylines identify this website's editorial responsibility; they do not imply affiliation
        with the song's creators or an independent expert endorsement.
      </p>
      <h2>How we check information</h2>
      <p>
        Our trend guides link to dated reporting and identify disagreements between sources. English meanings
        and gesture notes are our interpretation. Product prices and credit costs come from the same
        configuration as the tool. Review dates change when the content is reviewed, rather than on every page
        load.
      </p>
      <h2>Examples and measurements</h2>
      <p>
        <Link to="/baby-dance-example">The real output example</Link> lists the file properties we inspected.
        It is one example, not a measured success rate or a promise about processing time. We do not publish
        invented customer reviews or test statistics.
      </p>
      <h2>Contact and corrections</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for support, corrections and requests
        concerning your photos. Include the page URL or order number, without sending another child's photo.
      </p>
      <p>
        <Link to="/privacy">Privacy policy</Link> · <Link to="/refunds">Refund policy</Link> ·{' '}
        <Link to="/dmca">Rights and takedowns</Link>
      </p>
    </article>
  );
}
