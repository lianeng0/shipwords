import { describe, expect, it } from 'vitest';
import { handleStopRequest } from '../src/stop-hook';

// The other half of containerComposer.stop: what the Container subclass does with the request. Forwarding it would
// start a cold instance only to stop it, and that instance bills for its provisioned memory while it comes up.
describe('stop hook', () => {
  const target = (running: boolean, calls: string[]) => ({
    running,
    async stop() {
      calls.push('stop');
    },
  });
  const stop = () => new Request('http://compose/_stop', { method: 'POST' });

  it('stops a running instance and answers 204 before the request reaches the container', async () => {
    const calls: string[] = [];
    const response = await handleStopRequest(stop(), target(true, calls));
    expect(response?.status).toBe(204);
    expect(calls).toEqual(['stop']);
  });

  it('answers 204 without stopping when nothing runs, so a cold object never starts an instance', async () => {
    const calls: string[] = [];
    const response = await handleStopRequest(stop(), target(false, calls));
    expect(response?.status).toBe(204);
    expect(calls).toEqual([]);
  });

  it('leaves every other request to the container', async () => {
    const calls: string[] = [];
    const other = new Request('http://compose/compose', { method: 'POST' });
    expect(await handleStopRequest(other, target(true, calls))).toBeNull();
    // A GET has no side effects here: only the POST the workflow sends stops anything.
    const get = new Request('http://compose/_stop', { method: 'GET' });
    expect(await handleStopRequest(get, target(true, calls))).toBeNull();
    const nested = new Request('http://compose/_stop/files/x', { method: 'POST' });
    expect(await handleStopRequest(nested, target(true, calls))).toBeNull();
    expect(calls).toEqual([]);
  });
});
