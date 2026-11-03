// The stop request the workflow sends when a job ends (see containerComposer.stop in compose.ts), answered by the site's
// Container subclass before anything reaches the container. Forwarding it would start a cold instance only to stop it,
// and that instance bills for its provisioned memory while it comes up.

/** What the hook needs from the container: whether an instance is up, and how to stop it. */
export interface StopTarget {
  /** False when the instance is already stopped, or was never started (a cold Durable Object). */
  readonly running: boolean;
  stop(): Promise<void>;
}

/**
 * The 204 to answer with when the request is a stop, or null when it is anything else and belongs to the container.
 * Stopping is skipped when nothing is running: `stop()` would otherwise start an instance just to shut it down.
 */
export async function handleStopRequest(request: Request, target: StopTarget): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/_stop' || request.method !== 'POST') return null;
  if (target.running) await target.stop();
  return new Response(null, { status: 204 });
}
