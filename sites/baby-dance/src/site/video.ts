import site from '../../site.config';

export const realExample = {
  '@type': 'VideoObject',
  '@id': `${site.url}/baby-dance-example#video`,
  name: 'Bonito Bonito AI baby dance: real 5-second output',
  description:
    'A real 5-second output from Baby Dance AI: 720 × 1280, 30 fps, with the song already mixed in. Verified file details on the watch page.',
  thumbnailUrl: `${site.url}/media/sample-real.jpg`,
  contentUrl: `${site.url}/media/sample-real.mp4`,
  url: `${site.url}/baby-dance-example`,
  // Only the original publication day is recorded; midnight represents that day, not an observed upload time.
  uploadDate: '2026-10-31T00:00:00+08:00',
  duration: 'PT5S',
  width: 720,
  height: 1280,
  isFamilyFriendly: true,
};
