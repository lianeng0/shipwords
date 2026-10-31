import { defineSite } from '@shipwords/core/site';

// All config for this site. Prices are in the smallest currency unit (cents). Do not change id after launch.
//
// Two lengths, two costs (see src/models.server.ts):
//   5 s preview, 10 credits  — Seedance 2.0 mini 480p, about $0.09 upstream. One sign-up covers it exactly.
//   12 s full,   30 credits  — Kling 4.0 720p (a reference video bills twice the output seconds), about $2.04.
// So 30 credits at $6.99 keeps the full video at roughly 71% gross margin (volume tiers taper to 68% / 64%), and the
// free preview costs $0.09 per verified account — affordable only because the bonus is capped to one account per IP
// per day.
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
