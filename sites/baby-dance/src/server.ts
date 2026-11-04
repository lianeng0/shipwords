import { Container } from '@cloudflare/containers';
import { proxyRybbit } from '@shipwords/core/analytics';
import { reapFinishedContainerPage, runContainerMaintenance } from '@shipwords/jobs/container-cleanup';
import { mockMode } from '@shipwords/jobs/mock';
import { handleStopRequest } from '@shipwords/jobs/stop-hook';
import { defineGenerationWorkflow, type JobsEnv } from '@shipwords/jobs/workflow';
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
  private maintenance?: ReturnType<typeof reapFinishedContainerPage>;

  // The workflow shuts the instance down through here. Intercepted before super.fetch so that a cold
  // Durable Object answers without starting a container (a forwarded request would start one, and bill it).
  override async fetch(request: Request): Promise<Response> {
    // Internal binding-only maintenance path: never forwarded to a container.
    if (new URL(request.url).pathname === '/_reap' && request.method === 'POST') {
      this.maintenance ??= reapFinishedContainerPage(this.env.DB, this.env.COMPOSE, this.ctx.storage).finally(
        () => {
          this.maintenance = undefined;
        },
      );
      return Response.json(await this.maintenance);
    }
    const stopped = await handleStopRequest(request, this.ctx.container!);
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

export default {
  async scheduled(_controller, env) {
    if (mockMode(env as Env & Pick<JobsEnv, 'UPSTREAM_MOCK' | 'APP_URL'>)) return;
    await runContainerMaintenance(env.COMPOSE);
  },
  async fetch(request, env) {
    // Retired public maintenance URL: no auth bypass, job IDs, or side effects.
    if (new URL(request.url).pathname === '/_reap') return new Response(null, { status: 404 });
    // Rybbit analytics goes through this site's /stats/ and is proxied upstream here.
    const stats = await proxyRybbit(request, env.RYBBIT_UPSTREAM);
    if (stats) return stats;
    // Only local dev picks the locale from a cookie (for zh review); production is English only and passes requests straight to TanStack Start.
    return import.meta.env.DEV
      ? paraglideMiddleware(request, () => handler.fetch(request))
      : handler.fetch(request);
  },
} satisfies ExportedHandler<Env>;
