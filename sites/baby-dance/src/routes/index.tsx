import { pageHead } from '@shipwords/core/seo';
import { creditsFor } from '@shipwords/jobs/models';
import { type PublicJob, uploadReference, useGeneration } from '@shipwords/jobs/react';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { authClient } from '~/lib/auth';
import { track } from '~/lib/track';
import { m } from '~/paraglide/messages.js';
import { GUIDES } from '~/site/guide';
import { Plans, PricingLink } from '~/site/pricing';
import { firstVideoPrice, fullCredits, offers, previewCredits, priceSummary } from '~/site/product';
import { ProductFacts } from '~/site/product-facts';
import { SampleVideo } from '~/site/sample-video';
import { openSignIn } from '~/site/sign-in';
import site from '../../site.config';
import models from '../../site.models';

// Home page: the swap tool above the fold (upload a photo, pick 5 s or 12 s), then proof (samples), how it works,
// what makes it look right, pricing, a long FAQ, and a closing call to action. Copy lives in messages/home.
// Nothing here writes prompts: the routine, the camera, the cuts and the song come from the reference clip in R2.

const root = getRouteApi('__root__');

// Hero samples: the two lengths we actually deliver, plus one real output from this pipeline.
// Named so the default can fall back to a known value: the array is indexed by state, which may be out of range.
const SAMPLE_PREVIEW = {
  clip: 'sample-5s',
  tab: m.home_sample_tab_preview,
  tag: m.home_sample_tag_ours,
  caption: m.home_sample_caption_preview,
};
const SAMPLE_FULL = {
  clip: 'sample-12s',
  tab: m.home_sample_tab_full,
  tag: m.home_sample_tag_ours,
  caption: m.home_sample_caption_full,
};
const SAMPLE_REAL = {
  clip: 'sample-real',
  tab: m.home_sample_tab_real,
  tag: m.home_sample_tag_real,
  caption: m.home_sample_caption_real,
};
const SAMPLES = [SAMPLE_PREVIEW, SAMPLE_FULL, SAMPLE_REAL] as const;

const STEPS = [
  { title: m.home_step_upload_title, text: m.home_step_upload_text },
  { title: m.home_step_pick_title, text: m.home_step_pick_text },
  { title: m.home_step_post_title, text: m.home_step_post_text },
];

const WHY = [
  { title: m.home_why_routine_title, text: m.home_why_routine_text },
  { title: m.home_why_face_title, text: m.home_why_face_text },
  { title: m.home_why_song_title, text: m.home_why_song_text },
  { title: m.home_why_now_title, text: m.home_why_now_text },
];

// The four gestures the routine is built from. The Spanish line is the keyword people search ("cafecito baby dance"),
// the move is the answer. This section exists so the page is about the dance and not only about the tool.
const MOVES = [
  { line: m.home_trend_move_1_line, text: m.home_trend_move_1_text },
  { line: m.home_trend_move_2_line, text: m.home_trend_move_2_text },
  { line: m.home_trend_move_3_line, text: m.home_trend_move_3_text },
  { line: m.home_trend_move_4_line, text: m.home_trend_move_4_text },
];

// FAQ answers the questions the keyword actually gets asked: song, price, free trial, CapCut, watermark, photo rules,
// and whether the baby has to be yours. Kept as message functions so both locales resolve at render time.
const FAQ: { q: () => string; a: () => string }[] = [
  { q: m.home_faq_what_q, a: () => m.home_faq_what_a({ name: site.name }) },
  { q: m.home_faq_song_q, a: m.home_faq_song_a },
  { q: m.home_faq_how_q, a: m.home_faq_how_a },
  {
    q: m.home_faq_free_q,
    a: () =>
      m.home_faq_free_a({
        credits: site.signup.bonusCredits,
        days: site.signup.bonusExpiresDays,
        price: firstVideoPrice(),
      }),
  },
  {
    q: m.home_faq_cost_q,
    a: () => m.home_faq_cost_a({ preview: previewCredits, full: fullCredits, offers: priceSummary() }),
  },
  { q: m.home_faq_time_q, a: m.home_faq_time_a },
  { q: m.home_faq_capcut_q, a: m.home_faq_capcut_a },
  { q: m.home_faq_capcut_template_q, a: m.home_faq_capcut_template_a },
  { q: m.home_faq_login_q, a: m.home_faq_login_a },
  { q: m.home_faq_watermark_q, a: m.home_faq_watermark_a },
  { q: m.home_faq_photo_q, a: m.home_faq_photo_a },
  { q: m.home_faq_whose_q, a: m.home_faq_whose_a },
  { q: m.home_faq_real_q, a: () => m.home_faq_real_a({ name: site.name }) },
  { q: m.home_faq_post_q, a: m.home_faq_post_a },
  { q: m.home_faq_fail_q, a: m.home_faq_fail_a },
];

export const Route = createFileRoute('/')({
  head: () => {
    const base = pageHead(site, {
      title: m.home_meta_title(),
      description: m.home_meta_description({ price: firstVideoPrice() }),
      path: '/',
      image: `${site.url}/media/og-home.jpg`,
      jsonLd: [
        {
          '@type': 'WebApplication',
          name: site.name,
          // The exact phrase the title targets, kept separate from the brand so both can be matched.
          alternateName: 'Bonito Bonito AI baby dance generator',
          url: site.url,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Web',
          description: m.home_meta_description({ price: firstVideoPrice() }),
          inLanguage: 'en',
          isAccessibleForFree: true,
          screenshot: `${site.url}/media/sample-12s.jpg`,
          featureList: WHY.map((item) => item.title()),
          offers: offers(),
        },
        {
          '@type': 'VideoObject',
          name: 'Bonito Bonito baby dance — 12-second video example',
          description: m.home_sample_caption_full(),
          thumbnailUrl: `${site.url}/media/sample-12s.jpg`,
          contentUrl: `${site.url}/media/sample-12s.mp4`,
          // Original publication day, normalized to an ISO datetime; upload time was not recorded.
          uploadDate: '2026-10-31T00:00:00+08:00',
          duration: 'PT12S',
          width: 720,
          height: 1280,
          isFamilyFriendly: true,
        },
        {
          '@type': 'HowTo',
          name: m.home_steps_title(),
          totalTime: 'PT2M',
          image: `${site.url}/media/sample-12s.jpg`,
          step: STEPS.map((step) => ({
            '@type': 'HowToStep',
            name: step.title(),
            text: step.text(),
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQ.map((item) => ({
            '@type': 'Question',
            name: item.q(),
            acceptedAnswer: { '@type': 'Answer', text: item.a() },
          })),
        },
      ],
    });
    // pageHead covers canonical and the OG basics; these are the ones that decide how the link looks when it is shared.
    return {
      ...base,
      meta: [
        ...base.meta,
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image:alt', content: m.home_meta_image_alt() },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:title', content: m.home_meta_title() },
        { name: 'twitter:description', content: m.home_meta_description({ price: firstVideoPrice() }) },
        { name: 'theme-color', content: '#FFF8F0' },
      ],
    };
  },
  component: HomePage,
});

// Generator state survives sign-in, checkout and reloads.
const STATE_KEY = 'tool:state';
type ToolState = { modelId: string; photo: string | null };

function saveState(state: ToolState) {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

function loadState(): ToolState | null {
  try {
    return JSON.parse(sessionStorage.getItem(STATE_KEY) ?? 'null') as ToolState | null;
  } catch {
    return null;
  }
}

const isActive = (job: PublicJob) => job.status === 'queued' || job.status === 'submitted';

function HomePage() {
  const config = root.useLoaderData();
  const generation = useGeneration({ recaptchaSiteKey: config.recaptchaSiteKey });
  const [sample, setSample] = useState(0);
  const shown = SAMPLES[sample] ?? SAMPLE_PREVIEW;

  return (
    <>
      <section className="hero" id="make">
        <div className="hero-copy">
          <p className="eyebrow">{m.home_eyebrow()}</p>
          <h1>{m.home_title()}</h1>
          <p className="lead">{m.home_lead()}</p>
          <BabyDanceTool generation={generation} />
        </div>
        <figure className="sample">
          <SampleTabs value={sample} onPick={setSample} />
          <div className="sample-frame">
            <span className="sample-tag">{shown.tag()}</span>
            <SampleVideo
              key={shown.clip}
              clip={shown.clip}
              label={m.home_media_alt({ label: shown.tab() })}
              hero
            />
          </div>
          <figcaption className="sample-caption">
            <strong>{shown.tab()}</strong>
            <span>{shown.caption()}</span>
          </figcaption>
        </figure>
      </section>

      <section className="gallery-wrap band" id="samples">
        <p className="kicker">{m.home_gallery_kicker()}</p>
        <h2>{m.home_gallery_title()}</h2>
        <p className="muted">{m.home_gallery_lead()}</p>
        <ul className="gallery">
          {SAMPLES.map((item) => (
            <li key={item.clip}>
              <SampleVideo clip={item.clip} label={m.home_media_alt({ label: item.tab() })} />
              <strong>{item.tab()}</strong>
              <span>{item.caption()}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What the dance is. The clip is the product, but the searches are about the song's lines, so this section answers
          them in four gestures and hands the long-tail traffic to the lyrics guide. */}
      <section className="band" id="dance">
        <p className="kicker">{m.home_trend_kicker()}</p>
        <h2>{m.home_trend_title()}</h2>
        <p className="muted">{m.home_trend_lead()}</p>
        <ul className="moves">
          {MOVES.map((move) => (
            <li key={move.line()}>
              <strong>{move.line()}</strong>
              <span>{move.text()}</span>
            </li>
          ))}
        </ul>
        <p className="muted move-note">
          {m.home_trend_note()} <Link to="/bonito-bonito-lyrics-english">{m.home_trend_link()}</Link>.
        </p>
      </section>

      <section className="sheet" id="how">
        <p className="kicker">{m.home_steps_kicker()}</p>
        <h2>{m.home_steps_title()}</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.title()}>
              <h3>{step.title()}</h3>
              <p>{step.text()}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band" id="why">
        <p className="kicker">{m.home_why_kicker()}</p>
        <h2>{m.home_why_title()}</h2>
        <p className="muted">{m.home_why_lead()}</p>
        <div className="why">
          {WHY.map((item) => (
            <article key={item.title()}>
              <h3>{item.title()}</h3>
              <p>{item.text()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="band" id="pricing">
        <p className="kicker">{m.home_pricing_kicker()}</p>
        <h2>{m.home_pricing_title()}</h2>
        <p className="muted">
          {m.home_pricing_lead({ days: site.signup.bonusExpiresDays, offers: priceSummary() })}
        </p>
        <Plans />
        <ProductFacts />
      </section>

      <section className="sheet faq" id="faq">
        <p className="kicker">{m.home_faq_kicker()}</p>
        <h2>{m.home_faq_title()}</h2>
        {FAQ.map((item) => (
          <details key={item.q()}>
            <summary>{item.q()}</summary>
            <p>{item.a()}</p>
          </details>
        ))}
      </section>

      {/* Long-tail hub: the four guide pages get one contextual link each from the home page, which is what makes them
          crawlable and keeps them from competing as thin orphans. Copy comes from GUIDES so there is one source. */}
      <section className="band" id="guides">
        <p className="kicker">{m.home_guides_kicker()}</p>
        <h2>{m.home_guides_title()}</h2>
        <p className="muted">{m.home_guides_lead()}</p>
        <ul className="guide-links">
          {GUIDES.map((guide) => (
            <li key={guide.path}>
              <Link to={guide.path}>{guide.title()}</Link>
              <span>{guide.description()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="closer sheet" id="start">
        <h2>{m.home_closer_title()}</h2>
        <p>{m.home_closer_text()}</p>
        {/* biome-ignore lint/a11y/useValidAnchor: navigation to the generator; click only records attribution. */}
        <a className="cta" href="/#make" onClick={() => track('closer_cta')}>
          {m.home_closer_cta()}
        </a>
      </section>
    </>
  );
}

function SampleTabs({ value, onPick }: { value: number; onPick: (index: number) => void }) {
  return (
    <fieldset className="sample-tabs" aria-label={m.home_sample_tabs_label()}>
      {SAMPLES.map((item, index) => (
        <button key={item.clip} type="button" aria-pressed={value === index} onClick={() => onPick(index)}>
          {item.tab()}
        </button>
      ))}
    </fieldset>
  );
}

function BabyDanceTool({ generation }: { generation: ReturnType<typeof useGeneration> }) {
  const config = root.useLoaderData();
  const session = authClient(config.googleClientId).useSession();
  const { jobs, generate, cancel, submitting, error } = generation;
  const [modelId, setModelId] = useState<string>(models[0].id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);
  // Ask for confirmation when a job is already running: users who think nothing happened click again and get charged twice.
  const [confirmAnother, setConfirmAnother] = useState(false);
  const restored = useRef(false);
  const model = models.find((item) => item.id === modelId) ?? models[0];
  const cost = creditsFor(model, {});
  const rendering = jobs.some(isActive);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (models.some((item) => item.id === saved.modelId)) setModelId(saved.modelId);
      setPhoto(saved.photo);
    }
    restored.current = true;
    const url = new URL(window.location.href);
    if (url.searchParams.has('resume')) {
      setResumed(Boolean(saved?.photo));
      url.searchParams.delete('resume');
      window.history.replaceState(window.history.state, '', url);
    }
  }, []);

  useEffect(() => {
    if (restored.current) saveState({ modelId, photo });
  }, [modelId, photo]);

  useEffect(() => {
    if (!rendering) setConfirmAnother(false);
  }, [rendering]);

  useEffect(() => {
    if (error) track('generate_failed', { code: error.code ?? 'unknown' });
  }, [error]);

  const statuses = useRef(new Map<string, PublicJob['status']>());
  useEffect(() => {
    for (const job of jobs) {
      const before = statuses.current.get(job.id);
      statuses.current.set(job.id, job.status);
      if (before !== 'queued' && before !== 'submitted') continue;
      const seconds = job.finishedAt ? Math.round((job.finishedAt - job.createdAt) / 1000) : 0;
      if (job.status === 'succeeded') track('result_ready', { seconds });
      else if (job.status === 'failed' || job.status === 'canceled')
        track('result_failed', { status: job.status });
    }
  }, [jobs]);

  async function onFiles(files: FileList | null) {
    setUploadError(null);
    const file = files?.[0];
    if (!file) return;
    try {
      track('upload_started', { type: file.type, bytes: file.size });
      setPhoto(await uploadReference(file));
      track('upload_completed');
    } catch (e) {
      track('upload_failed');
      setUploadError(e instanceof Error ? e.message : m.home_tool_upload_failed());
    }
  }

  async function start() {
    if (!photo) return;
    const job = await generate({ modelId, slots: { baby: photo } });
    if (job) track('generate_started', { model: modelId, another: rendering });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const click = (blocked: string) => track('generate_click', { model: modelId, blocked });
    if (rendering && !confirmAnother) {
      click('confirm_another');
      setConfirmAnother(true);
      return;
    }
    setConfirmAnother(false);
    click('none');
    await start();
  }

  return (
    <form className="drop" onSubmit={onSubmit}>
      <ReturnNotice jobs={jobs} />

      {photo ? (
        <div className="drop-preview">
          <img src={photo} alt={m.home_tool_reference_alt()} width={64} height={64} />
          <span className="drop-preview-text">
            <strong>{m.home_upload_ready_title()}</strong>
            <span className="muted">{m.home_upload_ready_hint()}</span>
          </span>
          <span className="drop-actions">
            <button type="button" onClick={() => setPhoto(null)}>
              {m.home_upload_change()}
            </button>
          </span>
        </div>
      ) : (
        // biome-ignore lint/a11y/noStaticElementInteractions: drag events supplement the native file input below.
        <div
          className={`drop-zone${dragging ? ' is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void onFiles(e.dataTransfer.files);
          }}
        >
          <span className="drop-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 16V4m0 0L8 8m4-4 4 4" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </span>
          <span className="drop-title">{dragging ? m.home_upload_drop_active() : m.home_upload_title()}</span>
          <span className="drop-hint">{m.home_upload_hint()}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label={m.home_upload_title()}
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
      )}

      <fieldset className="versions">
        <legend>{m.home_version_legend()}</legend>
        {models.map((item) => (
          <label className="version" key={item.id}>
            <input
              type="radio"
              name="version"
              value={item.id}
              checked={modelId === item.id}
              onChange={() => setModelId(item.id)}
            />
            <span className="version-name">{item.name}</span>
            <span className="version-note">{m.home_version_credits({ credits: creditsFor(item, {}) })}</span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className="primary" disabled={submitting || !photo}>
        {submitting
          ? m.home_tool_starting()
          : confirmAnother
            ? m.home_tool_submit_another({ cost })
            : m.home_tool_submit({ cost })}
      </button>

      <p className="trust">
        <span>{m.home_trust_watermark()}</span>
        <span>{m.home_trust_refund()}</span>
        <span>{m.home_trust_format()}</span>
      </p>

      {resumed && !error && jobs.length === 0 && <p className="notice">{m.home_tool_resumed()}</p>}
      {confirmAnother && <p className="notice">{m.home_tool_confirm_another({ cost })}</p>}
      {uploadError && <p className="error">{uploadError}</p>}
      {error && <GenerationError code={error.code} message={error.message} retry={() => void start()} />}

      {jobs.length > 0 && (
        <div className="results" id="results">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              email={session.data?.user.email}
              onCancel={() => void cancel(job.id)}
            />
          ))}
        </div>
      )}
    </form>
  );
}

const RECENT_MS = 24 * 3600_000;

function ReturnNotice({ jobs }: { jobs: PublicJob[] }) {
  const rendering = jobs.some(isActive);
  const latest = jobs[0];
  const ready =
    latest?.status === 'succeeded' &&
    latest.finishedAt !== null &&
    Date.now() - latest.finishedAt < RECENT_MS;
  if (!rendering && !ready) return null;
  return (
    <a
      className="notice return-notice"
      href="#results"
      data-rybbit-event="return_notice_click"
      data-rybbit-prop-state={rendering ? 'generating' : 'ready'}
    >
      {rendering ? m.home_return_generating() : m.home_return_ready()}
    </a>
  );
}

function GenerationError({
  code,
  message,
  retry,
}: {
  code: string | undefined;
  message: string;
  retry: () => void;
}) {
  if (code === 'login_required') {
    return (
      <p className="notice">
        {m.home_tool_login_required({ credits: site.signup.bonusCredits })}{' '}
        <button type="button" className="link-button" onClick={() => openSignIn(retry, 'login_required')}>
          {m.home_tool_sign_in()}
        </button>
      </p>
    );
  }
  if (code === 'insufficient_credits') {
    return (
      <p className="notice">
        {m.home_tool_need_credits()}{' '}
        <PricingLink source="insufficient_credits">{m.home_tool_get_credits()}</PricingLink>
      </p>
    );
  }
  return <p className="error">{message}</p>;
}

function JobCard({ job, email, onCancel }: { job: PublicJob; email?: string; onCancel: () => void }) {
  const active = isActive(job);
  return (
    <article className="job">
      {job.outputs.map((output) =>
        output.mediaType.startsWith('video/') ? (
          // biome-ignore lint/a11y/useMediaCaption: generated videos have no caption track.
          <video key={output.url} src={output.url} controls playsInline />
        ) : (
          <img key={output.url} src={output.url} alt={job.prompt} loading="lazy" />
        ),
      )}
      {job.outputs.map((output) => (
        <a
          key={output.url}
          className="button"
          href={output.url}
          download
          onClick={() => track('result_download')}
        >
          {m.home_job_download()}
        </a>
      ))}
      {active && (
        <div className="job-pending">
          <p>{m.home_job_generating()}</p>
          {/* Only signed-in users get the completion email (the notify step in packages/jobs). */}
          {email && <p className="muted">{m.home_job_email({ email })}</p>}
        </div>
      )}
      {job.status === 'failed' && <p className="error">{m.home_job_failed()}</p>}
      {job.status === 'canceled' && <p className="muted">{m.home_job_canceled()}</p>}
      {active && (
        <button type="button" onClick={onCancel}>
          {m.home_job_cancel()}
        </button>
      )}
    </article>
  );
}
