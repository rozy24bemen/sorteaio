#!/usr/bin/env node
/*
 * Conditional pretest script.
 * - If DATABASE_URL points to a local Postgres host (localhost / 127.0.0.1) run a destructive reset (prisma db push --force-reset).
 * - Otherwise (e.g. production build, CI with remote Data Proxy or shared Postgres) skip the reset to avoid wiping real data.
 * You can force skipping with SKIP_DB_RESET=1.
 * You can force running with FORCE_DB_RESET=1 (use cautiously).
 */

const { spawnSync } = require('node:child_process');

function log(msg) { console.log(`[pretest] ${msg}`); }

const dbUrl = process.env.DATABASE_URL || '';
const skipFlag = process.env.SKIP_DB_RESET === '1';
const forceFlag = process.env.FORCE_DB_RESET === '1';

// Simple host detection
let host = '';
try {
  if (dbUrl.startsWith('postgres')) {
    const urlObj = new URL(dbUrl.replace(/^postgres(ql)?:/, 'postgresql:'));
    host = urlObj.hostname;
  } else if (dbUrl.startsWith('prisma://')) {
    host = 'data-proxy';
  } else if (dbUrl.startsWith('file:')) {
    host = 'sqlite';
  }
} catch (e) {
  log(`Could not parse DATABASE_URL; defaulting to skip. Raw=${dbUrl}`);
  process.exit(0);
}

const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);

if (skipFlag && !forceFlag) {
  log('SKIP_DB_RESET=1 set; skipping prisma db push.');
  process.exit(0);
}

if (!isLocal && !forceFlag) {
  log(`DATABASE_URL host='${host}' is not local; skipping destructive reset.`);
  log('If you need a clean schema on remote test DB, run: npx prisma migrate deploy (or FORCE_DB_RESET=1).');
  process.exit(0);
}

log(`Running prisma db push against local host '${host}'.`);
const args = ['prisma', 'db', 'push', '--skip-generate', '--force-reset'];
const result = spawnSync('npx', args, { stdio: 'inherit', shell: true });
if (result.status !== 0) {
  log(`prisma db push failed with exit code ${result.status}`);
  process.exit(result.status);
}
log('Local schema reset complete.');
