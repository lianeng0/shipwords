import { Link } from '@tanstack/react-router';
import { Table } from './guide';
import { freeConditions, fullCredits, priceSummary } from './product';

export function ProductFacts() {
  return (
    <section aria-label="Product details">
      <h3>Baby Dance AI at a glance</h3>
      <Table
        head={['Detail', 'What you get']}
        rows={[
          ['Free preview', freeConditions()],
          ['Full videos', `${priceSummary()}. ${fullCredits} credits per 12-second video; no subscription.`],
          ['Download', '720 × 1280 H.264 MP4, 30 fps, with the song; no watermark.'],
          ['Processing', 'The page shows your job status. You can leave and return to your account.'],
          ['Failed renders', 'Credits return to your balance automatically.'],
          [
            'Photos and deletion',
            <Link key="photo-guide" to="/baby-dance-photo-guide">
              Photo requirements, storage and removal requests
            </Link>,
          ],
        ]}
      />
    </section>
  );
}
