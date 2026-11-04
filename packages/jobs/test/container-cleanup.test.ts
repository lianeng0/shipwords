import { env } from 'cloudflare:test';
import { createDb } from '@shipwords/core/db/client';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reapFinishedContainerPage, runContainerMaintenance, stopContainer } from '../src/container-cleanup';
import { type JobStatus, jobs } from '../src/schema';

const db = createDb(env.DB);
const memory = () => {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      async get(key: string) {
        return values.get(key);
      },
      async put(key: string, value: string) {
        values.set(key, value);
      },
    } as Pick<DurableObjectStorage, 'get' | 'put'>,
  };
};
function namespace(fetch: (id: string, request: Request) => Promise<Response>) {
  return {
    idFromName: (name: string) => name,
    get: (id: string) => ({ fetch: (url: string, init: RequestInit) => fetch(id, new Request(url, init)) }),
  } as unknown as DurableObjectNamespace;
}
async function seed(count: number, status: JobStatus = 'succeeded', prefix = 'job_') {
  for (let index = 0; index < count; index++) {
    await db.insert(jobs).values({
      id: `${prefix}${String(index).padStart(3, '0')}`,
      modelId: 'test',
      kind: 'video',
      prompt: '',
      inputJson: '{}',
      upstream: 'yir',
      status,
      createdAt: 1,
    });
  }
}

beforeEach(async () => {
  await db.delete(jobs);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('container cleanup', () => {
  it('retries HTTP and transport failures against the same job without any start request', async () => {
    const calls: string[] = [];
    const ns = namespace(async (id, request) => {
      calls.push(id);
      expect(request.method).toBe('POST');
      expect(new URL(request.url).pathname).toBe('/_stop');
      if (calls.length === 1) return new Response(null, { status: 503 });
      if (calls.length === 2) throw new Error('connection reset');
      return new Response(null, { status: 204 });
    });
    await stopContainer(ns, 'job_one');
    expect(calls).toEqual(['job_one', 'job_one', 'job_one']);
  });

  it('does not hide an exhausted stop failure', async () => {
    let attempts = 0;
    const ns = namespace(async () => {
      attempts++;
      return new Response(null, { status: 503 });
    });
    await expect(stopContainer(ns, 'job_one')).rejects.toThrow('503');
    expect(attempts).toBe(3);
  });

  it('pages beyond 50 jobs with tied timestamps, includes canceled and excludes active jobs', async () => {
    await seed(51, 'succeeded', 'job_a');
    await seed(51, 'failed', 'job_b');
    await seed(9, 'canceled', 'job_c');
    await seed(2, 'submitted', 'job_d');
    await seed(2, 'queued', 'job_e');
    await seed(1, 'submitted', 'job_0');
    const stopped: string[] = [];
    const ns = namespace(async (id) => {
      stopped.push(id);
      return new Response(null, { status: 204 });
    });
    const { storage, values } = memory();
    const counts = [];
    counts.push(await reapFinishedContainerPage(env.DB, ns, storage));
    // This terminal transition happens behind a cursor already persisted by the first page.
    await db.update(jobs).set({ status: 'canceled' }).where(eq(jobs.id, 'job_0000'));
    for (let page = 0; page < 2; page++) counts.push(await reapFinishedContainerPage(env.DB, ns, storage));
    expect(counts.map((page) => page.scanned)).toEqual([50, 50, 11]);
    expect(new Set(stopped).size).toBe(111);
    expect(stopped.some((id) => id.startsWith('job_c'))).toBe(true);
    expect(stopped.some((id) => /^job_[de]/.test(id))).toBe(false);
    expect([...values.values()]).toEqual(['']);
    // A job which becomes terminal behind the cursor is picked up on the next complete pass.
    expect(stopped).not.toContain('job_0000');
    for (let page = 0; page < 3; page++) await reapFinishedContainerPage(env.DB, ns, storage);
    expect(stopped).toContain('job_0000');
  });

  it('counts failed stops honestly, continues to other pages, and retries on the next pass', async () => {
    await seed(51);
    let fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ns = namespace(async (id) => new Response(null, { status: fail && id === 'job_000' ? 503 : 204 }));
    const { storage } = memory();
    expect(await reapFinishedContainerPage(env.DB, ns, storage)).toEqual({
      scanned: 50,
      stopped: 49,
      failed: 1,
    });
    expect(await reapFinishedContainerPage(env.DB, ns, storage)).toEqual({
      scanned: 1,
      stopped: 1,
      failed: 0,
    });
    fail = false;
    expect(await reapFinishedContainerPage(env.DB, ns, storage)).toEqual({
      scanned: 50,
      stopped: 50,
      failed: 0,
    });
  });

  it('scheduled maintenance calls the binding-only object and propagates refusal', async () => {
    const ns = namespace(async (id, request) => {
      expect(id).toBe('container-maintenance');
      expect(new URL(request.url).pathname).toBe('/_reap');
      return new Response(null, { status: 503 });
    });
    await expect(runContainerMaintenance(ns)).rejects.toThrow('503');
  });
});
