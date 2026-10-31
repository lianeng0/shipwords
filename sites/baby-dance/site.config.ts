import { defineSite } from '@shipwords/core/site';

// All config for this site. Prices are in the smallest currency unit (cents). Do not change id after launch.
//
// Two lengths, two costs (see src/models.server.ts). Both are Kling 4.0 in reference mode, so the free preview is the same
// swap as the paid video, just shorter:
//   5 s preview, 10 credits  — quoted $2.94, billed $0.7605 (Yir billing, settled 2026-10-31, 720p reference mode).
//   12 s full,   30 credits  — same model, roughly twice the render; the 12 s bill still needs a real run to confirm.
// So 30 credits at $6.99 keeps the full video above 60% gross margin, and one free preview per verified account costs
// about $0.76 — affordable because the bonus is capped to one account per IP per day and expires in a week.
export default defineSite({
  id: 'babydance',
  name: 'Baby Dance AI',
  url: 'https://aibabydancing.com',
  locales: ['en'],
  defaultLocale: 'en',
  products: [
    {
      id: 'video_1',
      kind: 'credits',
      name: '1 full video (12s)',
      price: { amount: 699, currency: 'usd' },
      credits: 30,
      expiresDays: null,
    },
    {
      id: 'video_3',
      kind: 'credits',
      name: '3 full videos',
      price: { amount: 1899, currency: 'usd' },
      credits: 90,
      expiresDays: null,
    },
    {
      id: 'video_10',
      kind: 'credits',
      name: '10 full videos',
      price: { amount: 5599, currency: 'usd' },
      credits: 300,
      expiresDays: null,
    },
  ],
  // 10 credits = exactly one 5 s preview. Capped to one account per IP per day, and the credits expire in a week,
  // so the bonus cannot be farmed into a free video pipeline.
  signup: { bonusCredits: 10, bonusExpiresDays: 7, bonusPerIpDaily: 1 },
  guest: { dailyPerDevice: 0, dailyPerIp: 0, dailySiteBudget: 0, minRecaptchaScore: 0.5 },
  billing: { provider: 'stripe', automaticTax: false },
  analytics: {},
});
