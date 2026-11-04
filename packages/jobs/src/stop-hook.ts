// The stop request the workflow sends when a job ends (see containerComposer.stop in compose.ts), answered by the site's
// Container subclass before anything reaches the container. Forwarding it would start a cold instance only to stop it,
// and that instance bills for its provisioned memory while it comes up.

/** What the hook needs from the container: a way to kill the instance outright. */
export interface StopTarget {
  /** Kills the instance with SIGKILL. See the note on `stop()` below for why this is not `stop()`. */
  destroy(): Promise<void>;
  /** Authoritative platform check without starting an instance. */
  inspect(): Promise<object | null>;
}

/**
 * The 204 to answer with when the request is a stop, or null when it is anything else and belongs to the container.
 *
 * Two properties this relies on, both learned the hard way:
 * - `destroy()` sends SIGKILL, not SIGTERM. The image ran `node server.mjs` as PID 1, and PID 1 drops unhandled
 *   signals, so every `stop()` was silently swallowed and instances billed for days.
 * - There is no `running` guard here. `stop()` carries its own `if (this.container.running)` check, and after a
 *   deploy resets the Durable Object that check can read false for an instance that is very much alive; the stop
 *   then returns without doing anything. Always attempt destroy, then use inspect to distinguish a stopped
 *   instance from a platform failure. Neither call starts a container.
 */
export async function handleStopRequest(request: Request, target: StopTarget): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/_stop' || request.method !== 'POST') return null;
  try {
    await target.destroy();
  } catch (error) {
    if ((await target.inspect()) !== null) throw error;
  }
  return new Response(null, { status: 204 });
}
