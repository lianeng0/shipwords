#!/usr/bin/env node
// Usage: node tools/check-containers.mjs [--max-minutes 20] [--strict]
// Lists this account's container instances and flags any that have been running longer than the threshold.
// A container bills for the memory and disk of its instance type for as long as it lives, idle or not, so an
// instance the workflow forgot to stop burns money quietly. Run it after a deploy, or whenever the bill looks odd.
//
// Credentials: CLOUDFLARE_API_TOKEN plus CLOUDFLARE_ACCOUNT_ID, or a `cf` login on this machine (reused as-is).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const MAX_MINUTES = Number(option('max-minutes', '20'));
const STRICT = args.includes('--strict');

/** `cf` keeps its own login in the XDG config dir; reuse it when no API token is set, so this works on a dev box. */
function cfLogin() {
  const candidates = [
    process.env.XDG_CONFIG_HOME &&
      path.join(process.env.XDG_CONFIG_HOME, 'cloudflare', 'config', 'default.json'),
    process.env.APPDATA &&
      path.join(process.env.APPDATA, 'xdg.config', 'cloudflare', 'config', 'default.json'),
    path.join(os.homedir(), '.config', 'cloudflare', 'config', 'default.json'),
  ].filter(Boolean);
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (config.oauth_token) return { token: config.oauth_token, source: file };
  }
  return null;
}

const login = process.env.CLOUDFLARE_API_TOKEN
  ? { token: process.env.CLOUDFLARE_API_TOKEN, source: 'CLOUDFLARE_API_TOKEN' }
  : cfLogin();
if (!login) {
  console.error('No credentials: set CLOUDFLARE_API_TOKEN (Containers Read) or run `cf auth login`.');
  process.exit(2);
}

const account = process.env.CLOUDFLARE_ACCOUNT_ID ?? option('account', '');
if (!account) {
  console.error('No account id: set CLOUDFLARE_ACCOUNT_ID or pass --account <id>.');
  process.exit(2);
}

async function api(pathname) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    headers: { authorization: `Bearer ${login.token}` },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new Error(`${pathname} -> ${response.status} ${JSON.stringify(body?.errors ?? body)}`);
  }
  return body.result;
}

const applications = await api(`/accounts/${account}/containers/applications`);
if (applications.length === 0) {
  console.log(`No container applications on account ${account}.`);
  process.exit(0);
}

const now = Date.now();
const rows = [];
for (const application of applications) {
  const instances = await api(`/accounts/${account}/containers/applications/${application.id}/instances-v2`);
  for (const instance of instances) {
    const minutes = Math.round((now - Date.parse(instance.started_at)) / 60000);
    rows.push({
      application: application.name,
      name: instance.name,
      state: instance.status.state,
      minutes,
      where: instance.location?.name ?? '?',
      size: `${instance.configuration?.vcpu ?? '?'} vCPU / ${Math.round((instance.configuration?.memory ?? 0) / 1024)} GiB`,
    });
  }
}

if (rows.length === 0) {
  console.log('No container instances. Nothing billing.');
  process.exit(0);
}

rows.sort((a, b) => b.minutes - a.minutes);
const width = Math.max(...rows.map((row) => row.name.length), 8);
console.log(
  `${'instance'.padEnd(width)}  ${'state'.padEnd(9)}  ${'minutes'.padStart(7)}  ${'where'.padEnd(6)}  size`,
);
for (const row of rows) {
  const flag = row.state === 'running' && row.minutes > MAX_MINUTES ? '  <-- stale, stop it' : '';
  console.log(
    `${row.name.padEnd(width)}  ${String(row.state).padEnd(9)}  ${String(row.minutes).padStart(7)}  ${row.where.padEnd(6)}  ${row.size}${flag}`,
  );
}

const stale = rows.filter((row) => row.state === 'running' && row.minutes > MAX_MINUTES);
console.log(
  `\n${rows.length} instance(s), ${rows.filter((row) => row.state === 'running').length} running, ${stale.length} running longer than ${MAX_MINUTES} minutes.`,
);
if (stale.length > 0) {
  console.log(
    'Each idle standard-3 instance costs about $0.076/hour. Delete the application or stop the job that owns it.',
  );
  if (STRICT) process.exit(1);
}
