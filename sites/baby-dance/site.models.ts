import { definePublicModels } from '@shipwords/jobs/models';

// The tool page imports this file, so it ships to the browser: only what the page shows (id, name, price, slot).
// The upstream model, the cost cap, the reference clip and the face check live in src/models.server.ts, keyed by id.
//
// Two lengths of the same swap. The 5 s preview is priced so one sign-up bonus (10 credits) pays for exactly one,
// and runs on the cheap 480p model; the 12 s cut is the paid product on Kling 4.0 at 720p.
// Order matters: the first entry is preselected, and it must be the one a new account can afford.
export default definePublicModels([
  {
    id: 'baby-dance-preview',
    name: 'Baby Dance · 5s preview',
    kind: 'video',
    credits: 10,
    guest: false,
    allowedParameters: [],
    maxReferences: 0,
    effect: { slots: [{ id: 'baby', label: 'Baby photo', required: true }] },
  },
  {
    id: 'baby-dance',
    name: 'Baby Dance · 12s full',
    kind: 'video',
    credits: 30,
    guest: false,
    allowedParameters: [],
    maxReferences: 0,
    effect: { slots: [{ id: 'baby', label: 'Baby photo', required: true }] },
  },
]);
