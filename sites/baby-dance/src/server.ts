import { Container } from '@cloudflare/containers';
import { proxyRybbit } from '@shipwords/core/analytics';
import { handleStopRequest } from '@shipwords/jobs/stop-hook';
import { defineGenerationWorkflow } from '@shipwords/jobs/workflow';
import handler from '@tanstack/react-start/server-entry';
import { paraglideMiddleware } from '~/paraglide/server.js';
import site from '../site.config';
import models from './models.server';

// Worker entry: pages and API go to TanStack Start, plus the Workflow class for generation jobs and the compose container.
export const GenerationWorkflow = defineGenerationWorkflow(models, site);

/** Effect video compose (ffmpeg), image in packages/jobs/compose; one instance per jobId, stopped when the job ends. */
export class ComposeContainer extends Container {
  override defaultPort = 8080;
  // Backstop only: the workflow posts /_stop when a job finishes. Not short on purpose: the five calls a job makes to
  // this container are separated by up to minutes of upstream rendering, and waking for each one costs a cold start.
  override sleepAfter = '5m';

  // The workflow shuts the instance down through here. Intercepted before super.fetch so that a cold
  // Durable Object answers without starting a container (a forwarded request would start one, and bill it).
  override async fetch(request: Request): Promise<Response> {
    const stopped = await handleStopRequest(request, this);
    return stopped ?? super.fetch(request);
  }

  // biome-ignore lint/complexity/noBannedTypes: matches the Container base class constructor signature
  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    // With durable_object scheduling the image and instance type must be passed to start(); @cloudflare/containers 0.3.7 does not, so add them here.
    // Local dev runs no containers (no images), so leave it unchanged.
    const container = ctx.container as
      | (NonNullable<DurableObjectState['container']> & { images?: Record<string, unknown> })
      | undefined;
    if (!container?.images) return;
    const start = container.start.bind(container);
    container.start = (options) =>
      start({ ...options, image: container.images?.compose, instance: 'standard-3' } as never);
  }
}

/**
 * Stops container instances left behind by finished jobs. Instances outlive the job that started them when the stop on
 * the way out fails (see stop-hook.ts), and nothing rewrites an instance that already exists, so the only way back is to
 * wake each job's Durable Object and destroy what is still running. Only finished jobs are touched: a job in flight would
 * lose the files its next compose step reads.
 */
async function reapFinishedContainers(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/_reap' || request.method !== 'POST') return null;
  const rows = await env.DB.prepare(
    "select id from jobs where status in ('succeeded', 'failed', 'cancelled') order by created_at desc limit 50",
  ).all<{ id: string }>();
  const stopped: string[] = [];
  for (const row of rows.results) {
    try {
      const stub = env.COMPOSE.get(env.COMPOSE.idFromName(row.id));
      await stub.fetch('http://compose/_stop', { method: 'POST' });
      stopped.push(row.id);
    } catch {
      // The instance was already gone, which is the outcome we wanted anyway.
    }
  }
  return Response.json({ stopped: stopped.length, ids: stopped });
}

export default {
  async fetch(request, env) {
    // Rybbit analytics goes through this site's /stats/ and is proxied upstream here.
    const stats = await proxyRybbit(request, env.RYBBIT_UPSTREAM);
    if (stats) return stats;
    const reaped = await reapFinishedContainers(request, env);
    if (reaped) return reaped;
    // Only local dev picks the locale from a cookie (for zh review); production is English only and passes requests straight to TanStack Start.
    return import.meta.env.DEV
      ? paraglideMiddleware(request, () => handler.fetch(request))
      : handler.fetch(request);
  },
} satisfies ExportedHandler<Env>;
