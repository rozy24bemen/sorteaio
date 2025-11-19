/* Quick database host safety check.
 * Fails if DATABASE_URL (or POSTGRES_URL_NON_POOLING) points to localhost in a non-local run.
 */
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '';
if (!url) {
  console.error('[db-health] No DATABASE_URL / POSTGRES_URL vars found');
  process.exit(1);
}
try {
  // Normalize protocol for URL parser if needed
  const normalized = url.replace(/^postgres:/, 'postgresql:');
  const u = new URL(normalized);
  const host = u.hostname;
  if (/^(localhost|127\.0\.0\.1)$/i.test(host)) {
    console.error('[db-health] ERROR: Host is local (', host, ') in non-local context?');
    // Non-zero code signals misconfiguration
    process.exit(2);
  }
  console.log('[db-health] OK host=', host);
  process.exit(0);
} catch (e) {
  console.error('[db-health] Parse error:', e.message);
  process.exit(3);
}
