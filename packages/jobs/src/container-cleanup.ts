import { TERMINAL } from './schema';

const PAGE_SIZE = 50;
const CURSOR_KEY = 'container-cleanup-cursor';
const MAINTENANCE_ID = 'container-maintenance';

/** Bounded retries for HTTP/cancel/maintenance callers; Workflow steps also persist their own retries. */
export async function stopContainer(namespace: DurableObjectNamespace, jobId: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      const stub = namespace.get(namespace.idFromName(jobId));
      const response = await stub.fetch('http://compose/_stop', {
        method: 'POST',
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`compose stop failed: ${response.status}`);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 100 : 500));
    }
  }
}

/** Only called inside the maintenance Durable Object, never from the Worker's public fetch handler. */
export async function reapFinishedContainerPage(
  db: D1Database,
  namespace: DurableObjectNamespace,
  storage: Pick<DurableObjectStorage, 'get' | 'put'>,
): Promise<{ scanned: number; stopped: number; failed: number }> {
  const cursor = (await storage.get<string>(CURSOR_KEY)) ?? '';
  const rows = await db
    .prepare(
      `SELECT id FROM jobs WHERE status IN (${TERMINAL.map(() => '?').join(',')}) AND id > ? ORDER BY id LIMIT ?`,
    )
    .bind(...TERMINAL, cursor, PAGE_SIZE)
    .all<{ id: string }>();
  let stopped = 0;
  for (const row of rows.results) {
    try {
      await stopContainer(namespace, row.id);
      stopped++;
    } catch (error) {
      // Keep scanning so a failing instance cannot strand later pages. A full new pass retries this job.
      console.error('container cleanup failed', { jobId: row.id, error: String(error) });
    }
  }
  await storage.put(CURSOR_KEY, rows.results.length === PAGE_SIZE ? rows.results.at(-1)!.id : '');
  return { scanned: rows.results.length, stopped, failed: rows.results.length - stopped };
}

/** Waking the maintenance object through the binding never starts a container. */
export async function runContainerMaintenance(namespace: DurableObjectNamespace): Promise<void> {
  const stub = namespace.get(namespace.idFromName(MAINTENANCE_ID));
  const response = await stub.fetch('http://compose/_reap', { method: 'POST' });
  if (!response.ok) throw new Error(`container maintenance failed: ${response.status}`);
  console.log('container maintenance', await response.json());
}
