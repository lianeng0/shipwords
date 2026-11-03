import { describe, expect, it } from 'vitest';
import { containerComposer } from '../src/compose';

// A finished job has to shut its container down: memory and disk are billed for as long as the instance lives.
describe('compose client stop', () => {
  const namespace = (fetch: (url: string, init?: RequestInit) => Promise<Response>) =>
    ({
      idFromName: (name: string) => name,
      get: () => ({ fetch }),
    }) as unknown as DurableObjectNamespace;

  it('posts /_stop to the instance of that job', async () => {
    const calls: { url: string; method?: string }[] = [];
    const composer = containerComposer(
      namespace(async (url, init) => {
        calls.push({ url, method: init?.method });
        return new Response(null, { status: 204 });
      }),
      {} as R2Bucket,
    );
    await composer.stop?.('job_abc');
    expect(calls).toEqual([{ url: 'http://compose/_stop', method: 'POST' }]);
  });

  it('throws when the instance refuses, so the failure is visible in the workflow log', async () => {
    const composer = containerComposer(
      namespace(async () => new Response('nope', { status: 500 })),
      {} as R2Bucket,
    );
    await expect(composer.stop?.('job_abc')).rejects.toThrow(/compose stop failed: 500/);
  });
});
