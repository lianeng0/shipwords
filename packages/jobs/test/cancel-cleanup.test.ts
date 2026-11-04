import { env } from 'cloudflare:test';
import { getBalance, grantCredits, spendCredits } from '@shipwords/core/credits/ledger';
import { createDb } from '@shipwords/core/db/client';
import type { Core } from '@shipwords/core/server';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJobs } from '../src/handlers';
import { loadJob, markSucceeded, spendKey } from '../src/lifecycle';
import { jobs } from '../src/schema';
import * as workflow from '../src/workflow';

const db = createDb(env.DB);
async function fixture() {
  const userId = `u_${crypto.randomUUID()}`;
  const jobId = `job_${crypto.randomUUID().replaceAll('-', '')}`;
  await grantCredits(db, { userId, amount: 50, idemKey: `grant:${jobId}`, source: 'test' });
  await spendCredits(db, { userId, amount: 10, idemKey: spendKey(jobId) }, [
    db.insert(jobs).values({
      id: jobId,
      userId,
      modelId: 'test',
      kind: 'video',
      prompt: '',
      inputJson: '{}',
      upstream: 'yir',
      costCredits: 10,
      status: 'submitted',
    }),
  ]);
  const events: string[] = [];
  let unavailable = false;
  const log = vi.fn();
  const core = {
    db,
    site: { id: 'test', url: 'https://site.test' },
    log,
    getUser: async () => ({ id: userId }),
    env: {
      ...env,
      GUEST_COOKIE_SECRET: 'test',
      GENERATION_WORKFLOW: {
        get: async () => ({
          terminate: async () => {
            events.push('terminate');
          },
        }),
      },
      COMPOSE: {
        idFromName: (id: string) => id,
        get: (id: string) => ({
          fetch: async (url: string) => {
            expect(id).toBe(jobId);
            expect(url).toBe('http://compose/_stop');
            events.push('stop');
            return new Response(null, { status: unavailable ? 503 : 204 });
          },
        }),
      },
    },
  } as unknown as Core;
  return {
    core,
    jobId,
    userId,
    events,
    log,
    failStops: (value: boolean) => {
      unavailable = value;
    },
  };
}
const request = () => new Request('https://site.test/api/jobs/job/cancel', { method: 'POST' });

afterEach(() => vi.restoreAllMocks());

describe('cancel cleanup', () => {
  it('mock cancellation never touches a real container binding', async () => {
    const f = await fixture();
    Object.assign(f.core.env, { UPSTREAM_MOCK: '1', APP_URL: 'http://localhost:5030' });
    expect((await createJobs(f.core, []).cancel(request(), f.jobId)).status).toBe(200);
    expect(f.events).toEqual(['terminate']);
    expect((await getBalance(db, f.userId)).available).toBe(50);
  });
  it('does not delay upstream cancellation while a container stop is still pending', async () => {
    const f = await fixture();
    await db.update(jobs).set({ upstreamJobId: 'up_running' }).where(eq(jobs.id, f.jobId));
    let releaseStop!: () => void;
    const pending = new Promise<void>((resolve) => {
      releaseStop = resolve;
    });
    const upstream = vi.fn(async () => {
      f.events.push('cancel upstream');
      releaseStop();
    });
    vi.spyOn(workflow, 'createAdapters').mockReturnValue({
      yir: {
        name: 'yir',
        submit: async () => {
          throw new Error('unexpected submit');
        },
        poll: async () => ({ state: 'running' }),
        cancel: upstream,
      },
    });
    const namespace = f.core.env as unknown as { COMPOSE: DurableObjectNamespace };
    namespace.COMPOSE = {
      idFromName: (id: string) => id,
      get: () => ({
        fetch: async () => {
          f.events.push('stop pending');
          await pending;
          f.events.push('stop done');
          return new Response(null, { status: 204 });
        },
      }),
    } as unknown as DurableObjectNamespace;
    await createJobs(f.core, []).cancel(request(), f.jobId);
    expect(upstream).toHaveBeenCalledWith('up_running');
    expect(f.events.indexOf('cancel upstream')).toBeLessThan(f.events.indexOf('stop done'));
  });
  it('concurrent duplicate cancels terminate before stopping and refund exactly once', async () => {
    const f = await fixture();
    const api = createJobs(f.core, []);
    const replies = await Promise.all([api.cancel(request(), f.jobId), api.cancel(request(), f.jobId)]);
    expect(replies.map((reply) => reply.status)).toEqual([200, 200]);
    expect(f.events[0]).toBe('terminate');
    expect(f.events.filter((event) => event === 'stop')).toHaveLength(2);
    expect((await loadJob(db, f.jobId))?.status).toBe('canceled');
    expect((await getBalance(db, f.userId)).available).toBe(50);
  });

  it('cleanup failure preserves cancellation/refund and another cancel retries the cleanup', async () => {
    const f = await fixture();
    const api = createJobs(f.core, []);
    f.failStops(true);
    expect((await api.cancel(request(), f.jobId)).status).toBe(200);
    expect(f.events.filter((event) => event === 'stop')).toHaveLength(3);
    expect(f.log).toHaveBeenCalledWith(
      'compose stop failed after cancel',
      expect.objectContaining({ jobId: f.jobId }),
    );
    f.failStops(false);
    await api.cancel(request(), f.jobId);
    expect(f.events.filter((event) => event === 'stop')).toHaveLength(4);
    expect((await getBalance(db, f.userId)).available).toBe(50);
  });

  it('a success racing with cancellation stays delivered and charged without being stopped by cancel', async () => {
    const f = await fixture();
    f.core.getUser = (async () => {
      await markSucceeded(db, f.jobId, [{ key: `jobs/${f.jobId}/0.mp4`, mediaType: 'video/mp4' }]);
      return { id: f.userId, email: 'test@example.com', name: 'Test' };
    }) as Core['getUser'];
    await createJobs(f.core, []).cancel(request(), f.jobId);
    expect((await loadJob(db, f.jobId))?.status).toBe('succeeded');
    expect((await getBalance(db, f.userId)).available).toBe(40);
    expect(f.events).toEqual([]);
  });

  it("an unrelated user cannot stop another user's container", async () => {
    const f = await fixture();
    f.core.getUser = (async () => ({
      id: 'other-user',
      email: 'other@example.com',
      name: 'Other',
    })) as Core['getUser'];
    expect((await createJobs(f.core, []).cancel(request(), f.jobId)).status).toBe(404);
    expect(f.events).toEqual([]);
    expect((await getBalance(db, f.userId)).available).toBe(40);
  });
});
