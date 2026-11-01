import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { GuidePage, Table } from '~/site/guide';
import { realExample } from '~/site/video';
import site from '../../site.config';

const PATH = '/baby-dance-example';
export const Route = createFileRoute('/baby-dance-example')({
  head: () =>
    pageHead(site, {
      path: PATH,
      title: realExample.name,
      description: realExample.description,
      image: realExample.thumbnailUrl,
      jsonLd: [realExample],
    }),
  component: ExamplePage,
});
function ExamplePage() {
  return (
    <GuidePage
      path={PATH}
      title={realExample.name}
      intro={
        <p className="lead">
          Watch a 5-second output below. These file properties were inspected on 1 November 2026;
          the clip is a single example, not a benchmark of all generations.
        </p>
      }
    >
      <video
        className="watch-video"
        src={realExample.contentUrl}
        poster={realExample.thumbnailUrl}
        width={720}
        height={1280}
        controls
        muted
        playsInline
        preload="metadata"
        aria-label={realExample.name}
      />
      <h2>Verified file details</h2>
      <Table
        head={['Property', 'This example']}
        rows={[
          ['Duration', '5.000 seconds'],
          ['Frame size', '720 × 1280 pixels'],
          ['Frame rate', '30 fps'],
          ['Encoding', 'H.264 in an MP4 container'],
          ['Audio', 'AAC, stereo, 44.1 kHz — the song is already mixed in.'],
          ['File size', '1,751,006 bytes'],
        ]}
      />
      <p>
        This is a straight download of the 5-second preview: the face swap rendered at 720 × 1280 and 30 fps,
        then the song mixed in. Nothing was re-cut, graded or re-encoded by hand afterwards.
      </p>
      <h2>What to check in your preview</h2>
      <p>
        Play your result, check the face and selected length, then review the file before ordering a full
        video. For input requirements and removal requests, see the{' '}
        <Link to="/baby-dance-photo-guide">photo and privacy guide</Link>.
      </p>
    </GuidePage>
  );
}
