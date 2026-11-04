import { describe, expect, it } from 'vitest';
import { handleStopRequest } from '../src/stop-hook';

// The other half of containerComposer.stop: what the Container subclass does with the request. Forwarding it would
// start a cold instance only to stop it, and that instance bills for its provisioned memory while it comes up.
describe('stop hook', () => {
  const target = (calls: string[], fail = false) => ({
    async destroy() {
      calls.push('destroy');
      if (fail) throw new Error('no instance');
    },
    async inspect() {
      return null;
    },
  });
  const stop = () => new Request('http://compose/_stop', { method: 'POST' });

  it('kills the instance and answers 204 before the request reaches the container', async () => {
    const calls: string[] = [];
    const response = await handleStopRequest(stop(), target(calls));
    expect(response?.status).toBe(204);
    expect(calls).toEqual(['destroy']);
  });

  // destroy() is SIGKILL, so it needs no `running` guard: after a deploy resets the Durable Object that guard can
  // read false for a live instance and skip the stop entirely, which is how five instances survived for days.
  it('still answers 204 when there is no instance to kill, so a cold object never starts one', async () => {
    const calls: string[] = [];
    const response = await handleStopRequest(stop(), target(calls, true));
    expect(response?.status).toBe(204);
    expect(calls).toEqual(['destroy']);
  });

  it('leaves every other request to the container', async () => {
    const calls: string[] = [];
    const other = new Request('http://compose/compose', { method: 'POST' });
    expect(await handleStopRequest(other, target(calls))).toBeNull();
    // A GET has no side effects here: only the POST the workflow sends kills anything.
    const get = new Request('http://compose/_stop', { method: 'GET' });
    expect(await handleStopRequest(get, target(calls))).toBeNull();
    const nested = new Request('http://compose/_stop/files/x', { method: 'POST' });
    expect(await handleStopRequest(nested, target(calls))).toBeNull();
    expect(calls).toEqual([]);
  });

  it('propagates platform failures while an instance still exists', async () => {
    await expect(
      handleStopRequest(stop(), {
        async destroy() {
          throw new Error('platform unavailable');
        },
        async inspect() {
          return { image: 'compose' };
        },
      }),
    ).rejects.toThrow('platform unavailable');
  });

  it('does not assume the instance is gone when inspection fails', async () => {
    await expect(
      handleStopRequest(stop(), {
        async destroy() {
          throw new Error('destroy failed');
        },
        async inspect() {
          throw new Error('inspection unavailable');
        },
      }),
    ).rejects.toThrow('inspection unavailable');
  });
});
