# Baby Dance AI design direction

Each site should look clearly different from the others. Write this down before changing `src/site/styles.css` and components.

## Mood

A family album that happens to be a tool — warm, soft and a little silly. The visitor is a parent or a grandparent, often on a phone, holding a photo they already love. Nothing on the page should feel like an AI console or a developer tool.

## Fonts

- One self-hosted variable font: Nunito (`public/fonts/nunito-latin-wght-normal.woff2`, latin subset, 39 kB), declared
  as `Nunito Var` with `font-weight: 200 1000` and `font-display: swap`, preloaded in `__root.tsx`. Same file for
  headings and body — the weight axis carries the hierarchy, so there is no second download.
- Fallback stack stays rounded-native: `ui-rounded`, Quicksand, Segoe UI Variable, system-ui.
- No monospace for reading copy; only `.mono` for dates and figures, and even that is the same family with tabular
  numerals.

## Colour

| Role    | Value                                     | Note                           |
| ------- | ----------------------------------------- | ------------------------------ |
| Page    | `#FFF8F0` cream                           | warm, never pure white         |
| Surface | `#FFFFFF` cards with `#F1E4D6` 1px border | soft edge, no heavy shadows    |
| Primary | `#FF6B4A` coral                           | the one button that matters    |
| Accent  | `#7FD1AE` mint                            | success, "your video is ready" |
| Ink     | `#2B2118`                                 | warm near-black, not `#000`    |
| Muted   | `#8A7A6D`                                 | secondary copy                 |

Two colours do the work: coral for action, mint for "done". No gradients, no glass, no neon.

## First screen

- Free-preview entry: keep the outcome headline and one short sentence, then the upload card. The card explains that new accounts receive one free 5-second preview and sign-in is required. Before a photo is selected, the primary button opens the photo picker instead of appearing disabled. Signed-in users still see the actual credit cost; do not promise repeat free renders.
- On phones, reduce hero spacing so the upload action is visible in the first screen. Keep the photo target at least 120px high and retain explicit length choices.

- Mobile: the upload card first — a big dashed rounded box reading "Drop a baby photo here", tap target at least 120px tall — then the five dance style chips, then one primary button.
- Desktop: two columns. Left, the upload card, style chips and button stacked; right, a short looping sample clip (muted, autoplay) of a real result, so the promise is shown before it is read.
- The headline states the outcome, not the technology: "Make your baby dance", not "AI video generation".
- Trust line under the button: "No watermark · Failed renders refunded · 10-second MP4".

## Details that carry the brand

- Rounded corners 16–20px everywhere; buttons fully rounded.
- Chips for the dance styles with a small motion glyph, selected state in coral.
- The rendering state is playful copy plus a progress shimmer, never a bare spinner for two minutes.
- Empty states use hand-drawn-feel line icons, not stock illustration packs.

## Avoid

- Dark mode as the default, purple-blue "AI" palettes, glassmorphism, particle backgrounds.
- Stock photos of babies that are not ours — every sample must come from consenting users or our own test photos.
- Anything that looks like the other sites in this repo: this one is warm and rounded, not editorial and not utilitarian.

## What is built (2026-10-31)

- `src/site/styles.css` is now site-specific; the template's blue/grey defaults are gone.
- Hero is two columns on desktop (copy + tool on the left, sample clip on the right) and one column on mobile with the
  upload card first, as described above. The sample has three tabs: 5s preview, 12s full, and one real output.
- Upload is a drag-and-drop dashed card (`64px` thumb after upload), length is a pair of radio chips, and the CTA carries
  the credit price. Trust line sits under the button.
- Sections below the fold: gallery of three real clips, three-step how-it-works, four "why it holds up" cards, pricing,
  a 13-question FAQ, and a closing banner.
- Fonts are self-hosted (see above) and preloaded; nothing is fetched from a third-party CDN at runtime.
- Every media container sets `min-width: 0`: a 720px `<video>` otherwise stretches its grid column and the page
  overflows sideways on phones.
- Four long-tail guide pages live under `src/routes/*.tsx` and share `src/site/guide.tsx` (same `sheet` card, same
  `table-wrap` tables): `/bonito-bonito-lyrics-english`, `/is-bonito-bonito-ai`, `/thiago-navarro`,
  `/bonito-bonito-without-capcut`. Copy lives in `messages/guides/{en,zh}.json`; each page is listed in the sitemap,
  `llms.txt`, a `#guides` section on the homepage, and the footer row.

## Content and media

Keep the warm sheet and table styles for product facts, source notes, photo guidance and About. Public video examples use a portrait player with native controls. Only the hero starts automatically; gallery videos start on request and pause offscreen. Source and editorial links remain readable and keyboard accessible.
