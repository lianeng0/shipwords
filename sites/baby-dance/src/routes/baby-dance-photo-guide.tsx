import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { GuidePage, Table } from '~/site/guide';
import { organization, updatedDate } from '~/site/product';
import { ProductFacts } from '~/site/product-facts';
import site from '../../site.config';

const PATH = '/baby-dance-photo-guide';
const TITLE = 'Baby dance photo guide: choosing a photo, storage and deletion';
export const Route = createFileRoute('/baby-dance-photo-guide')({
  head: () =>
    pageHead(site, {
      title: TITLE,
      path: PATH,
      description:
        'Photo requirements for Baby Dance AI, what to check before generating, and how to request removal of uploaded photos and videos.',
      jsonLd: [
        {
          '@type': 'Article',
          headline: TITLE,
          datePublished: updatedDate,
          dateModified: updatedDate,
          author: organization,
          publisher: organization,
          mainEntityOfPage: `${site.url}${PATH}`,
          image: `${site.url}/media/og-home.jpg`,
        },
      ],
    }),
  component: PhotoGuide,
});
function PhotoGuide() {
  return (
    <GuidePage
      path={PATH}
      title={TITLE}
      intro={
        <p className="lead">
          Choose a clear photo with one face looking toward the camera, eyes visible and even lighting. Upload
          only your child's photo or one you have permission from a parent or guardian to use.
        </p>
      }
    >
      <h2>Before uploading</h2>
      <Table
        head={['Check', 'What to choose']}
        rows={[
          ['People', 'One clearly visible face; avoid group photos.'],
          ['Framing', 'Face toward the camera, with no hands or objects covering it.'],
          ['Light', 'Even daylight and visible facial details.'],
          ['File', 'JPG, PNG or WebP. Use a sharp original instead of a filtered screenshot.'],
        ]}
      />
      <h2>Try a preview first</h2>
      <p>
        Use the 5-second preview before choosing a full video. Check the downloaded output and your selected
        length before starting another render. The page shows the credit cost before submission.
      </p>
      <p>
        <Link to="/baby-dance-example">Watch the existing real output and inspect its file details</Link>.
        That example is not a controlled comparison of different input photos; we have not published a
        measured success rate.
      </p>
      <h2>Where your photo goes</h2>
      <p>
        Cloudflare hosts uploads and results. The AI provider receives your photo to process your request. See
        the <Link to="/privacy">privacy policy</Link> for the current retention terms and processors.
      </p>
      <p>
        File links can be opened by anyone who has the URL. Treat upload and result URLs as private links and
        share them only with people you trust.
      </p>
      <h2>Request removal</h2>
      <p>
        Email <a href="mailto:support@aibabydancing.com">support@aibabydancing.com</a> from your account
        address with the order or job reference. Ask for the uploaded photo, generated video or account data
        you want removed. You do not need to upload the photo again.
      </p>
      <h2>If a render fails</h2>
      <p>
        Failed renders return their credits automatically. Check the job status before retrying. For a
        purchase refund, follow the <Link to="/refunds">refund policy</Link>.
      </p>
      <ProductFacts />
    </GuidePage>
  );
}
