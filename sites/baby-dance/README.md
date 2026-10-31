# Baby Dance AI

- **Status**: In development — local build passes (`pnpm check`), two launch blockers below are unresolved
- **Domain**: aibabydancing.com
- **Launch date**: not set
- **Payment account**: not set (Stripe; needs a legal entity and account name)
- **Metrics**: GA4 property, Rybbit siteId, GSC property — all unset
- **Created**: 2026-10-30

## Keywords

**Primary**: `ai baby dance`

**Secondary** (map to the home page, one phrase each in title, H1, lead and FAQ):

| Phrase | Where it goes |
| --- | --- |
| `bonito bonito ai baby dance` | title, H1, first paragraph |
| `ai baby dance video generator` | title suffix, pricing section |
| `ai baby dancing video` | H1 alternative, FAQ question |
| `make my baby dance ai` | how-it-works step 1 |
| `ai baby dance generator free` | **blocked**, see "The word free" below |

**Long tail** (one page each, added after Search Console shows the query):

`bonito bonito baby dance`, `cafecito baby dance`, `un cafecito riquito`, `bonito bonito baby dance no watermark`, `ai baby dance without login`, `bonito bonito capcut template`

**Blog** (informational, links up to the tool): `bonito bonito lyrics english`, `is bonito bonito ai`, `thiago navarro`

**Shipped title and description**

- Title: `Bonito Bonito AI Baby Dance Generator | AI Baby Dancing`
- H1: `Bonito Bonito AI Baby Dance`
- Description: `Turn one baby photo into a Bonito Bonito AI baby dance video in minutes. Song included, no watermark, no CapCut or app needed. Try the AI baby dance generator free.`

## What the trend is

"Bonito, Bonito" is a song released in early August 2026, sung by **Thiago Navarro** — a virtual singer created by the Venezuelan creator **Anier Cruz**, who wrote the lyrics and used AI for the voice, music and image. The hook is "un cafecito riquito riquito" ("a little coffee, so tasty"). The baby-dance version spread from about **24 October 2026** as a CapCut template captioned "Wait until your baby starts dancing…": vertical, waist-up, the baby waves, puts both hands on its cheeks, hugs itself and sways; the most-played post had about 18 million plays by 28 October.

The routine people are copying is **waist-up, not full body**. The five presets in `src/routes/index.tsx` are written for that framing, with "Bonito Bonito" as the default style (waves one hand, both hands on the cheeks, a self-hug, a sway).

## Competitors (measured 2026-10-30)

| Site | Offer | Price | Weakness to attack |
| --- | --- | --- | --- |
| tryh3.com/generator/bonito-bonito-ai | 1 photo → 10 s / 15 s / full 23 s, 9:16, sound on the MP4, models Seedance 2.0 Mini (default) / Fast / Pro / 2.5 / MiniMax H3, 480p default | from 20 credits (≈$0.55) per 10 s | Credit pricing is opaque (20 → 1,328 credits across options); 480p default; no clear refund copy beyond a line |
| fungen.ai, miraflow.ai | Blog posts ranking for the trend, no generator | — | They capture the informational query; we need the blog pages |
| YouCam Video / mobile apps | Motion swap: upload a dance video + a baby photo | app subscription | Requires an app, a dance clip and editing skill; we need zero of those |

**Our angle**: one photo, no prompt, no app, no CapCut — and a fixed dollar price per video instead of a credit ladder.

## The two launch blockers

### 1. "Song included" — not possible with the current pipeline

`klingai/kling-2.6` at 720p produces **no audio track** (audio exists only at 1080p, and even then it is model-generated ambient sound, not a chosen song). The competitor's "sound on the MP4" is done by muxing the Bonito Bonito clip onto the finished video afterwards.

Three ways to close this, pick one before launch:

1. **Mux the audio server-side** — ship the optional `packages/jobs/compose` ffmpeg container (Cloudflare Containers, needs the Workers Paid plan, about $0.0007 per job) and mux a fixed audio bed onto every output. This is the only path that matches the title's promise.
2. **Switch to a model with native audio** — `kling-2.6` at 1080p with `generate_audio: true` ($0.11–0.14/s ⇒ about $1.10–1.40 per 10 s). Gives beat-synced sound, **not** Bonito Bonito.
3. **Change the promise** — drop "song included" from the title and description.

**Rights note**: the song belongs to Anier Cruz. Muxing it onto paid output is commercial use of someone else's recording. Confirm the licence situation (or use a licensed/royalty-free bed that fits the same beat) before shipping option 1; do not let the copy run ahead of the right to use it.

### 2. The word "free"

`site.config.ts` currently sets `signup.bonusCredits: 0` and zero guest tries, because a 10 s render costs about $0.40. The shipped description says "Try the AI baby dance generator free", which is false as configured.

Option A — make it true: one free video per verified account (`bonusCredits: 10`, `bonusExpiresDays: 7`, `bonusPerIpDaily: 1`). Budget $0.40 per sign-up as acquisition cost. Option B — remove "free" from the description and target `ai baby dance generator` instead. Decide before launch; a false free claim is a refund magnet and a Google quality problem.

## Media is not in the repo

The reference clips, the song and the sample videos are cut from third-party footage and music, so they are not committed:

- `public/media/` (source clips, song, sample cuts, `og-home.jpg`) is git-ignored.
- The R2 objects under `assets/baby-dance/` (`source-5s.mp4`, `source-12s.mp4`, `song-5s.m4a`, `song-12s.m4a`) are keyed in `src/models.server.ts`; upload them with `wrangler r2 object put baby-dance-outputs/assets/baby-dance/<file> --file=<file> --remote`.

Source clips must be square-pixel: Kling rejects non-1:1 PAR with `VideoNormalize failed, non-square pixels detected` (TikTok downloads carry `sample_aspect_ratio=5760:5767`). Re-encode with `ffmpeg -vf setsar=1 -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a copy -movflags +faststart` before uploading.

## Model, cost and price

| Item | Value |
| --- | --- |
| Upstream | `klingai/kling-2.6` via Yir, uploaded photo as the first frame |
| Pinned parameters | 720p, 10 s, no audio, 9:16 (user may pick 16:9 or 1:1) |
| Upstream cost | $0.0368–0.042/s at 720p ⇒ about $0.37–0.42 per 10 s clip (list prices read 2026-10-30) |
| `maxCost` | $0.55 per job (headroom for a failover channel) |
| Price | 10 credits = 1 video: $2.99 / $9.99 for 5 / $29.99 for 20 |
| Margin | about 85% before Stripe fees |

**Before launch, run three real generations** (front-facing, side-facing, and one where the baby is sitting) and record latency, whether the face and outfit held, and the billed cost. If likeness drifts, fix the prompt, not the price.

## Open items

- [ ] Rewrite this README: it still describes the `kling-2.6` 10 s pipeline, while the shipped site runs `klingai/kling-4.0` in reference mode (5 s preview / 12 s full) with the song muxed by the compose container.
- [ ] Replace the face-swap check: SFace scores different babies at 0.51–0.74 and the same baby at 0.79–0.82, so the 0.45 threshold fails every real swap. Score the face-box pixel diff instead (identical 0.0 / same baby repainted 22.8 / swapped baby 59.2).
  - Done 2026-11-01: `check.minChange: 10` on both models, the container's `faces.py` now returns `{similarity, change}`. Still open until one real job passes the check end to end.
- [ ] Decide the audio path (blocker 1) and the free-trial question (blocker 2).
- [ ] Run three real generations; confirm model, prompt and `maxCost`.
- [ ] Replace the placeholder `database_id` in `wrangler.jsonc` after `pnpm wrangler d1 create baby-dance`.
- [ ] Create the R2 bucket and the `uploads/` lifecycle rule; align the privacy page with it.
- [ ] Fill the real support address into the policy pages and have a human read them.
- [ ] Stripe webhook, keys, one test purchase plus a refund.
- [ ] Hero example: before/after pairs from consenting users or our own test photos. No stock photos of other people's children.
- [ ] Blog pages for the informational terms (`bonito bonito lyrics english`, `is bonito bonito ai`, `thiago navarro`), each linking to the tool.
- [ ] Analytics, GSC, IndexNow.

## Log

- 2026-10-30 Created from `templates/ai-site`, retargeted to `ai baby dance`; model switched from image to `klingai/kling-2.6` video with the photo as first frame; five dance presets added to the tool page; guest trial and sign-up bonus disabled; `pnpm check` passes.
- 2026-10-31 Keyword matrix and competitor set recorded; title and H1 moved onto the `bonito bonito` trend; clip length raised from 5 s to 10 s to match the competitor's floor; audio and "free" recorded as launch blockers.
