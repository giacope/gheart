/**
 * The execution-layer moment: an agent about to open a PR asks the brain
 * first, gets told the reviewer would reject it, self-corrects, and asks
 * again. Run with the gheart server up (and the brain seeded):
 *
 *   npm run seed:brain && npm run precheck:demo
 */
import type { PrecheckRequest, PrecheckResponse } from '../shared/types';

const API = process.env.GHEART_API || 'http://localhost:8788';

async function precheck(req: PrecheckRequest): Promise<PrecheckResponse> {
  const res = await fetch(`${API}/api/precheck`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`precheck failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<PrecheckResponse>;
}

function show(label: string, r: PrecheckResponse) {
  console.log(`\n${label}`);
  console.log(`  predicted: ${r.predictedVerdict} (confidence ${r.confidence})`);
  for (const m of r.memories) {
    console.log(`  memory: ${m.verdict === 'reject' ? '💔' : '💚'} #${m.pr} — ${m.reason} (${m.url})`);
  }
  console.log(`  advice: ${r.advice}`);
}

console.log('🤖 agent: about to open a PR that drops the user_events table…');

const draft: PrecheckRequest = {
  title: 'feat: drop unused user_events table',
  summary:
    'Migration that drops the legacy user_events table from the schema. Straightforward drop, no rollback needed since the table is unused.',
  fingerprint: {
    size: 'medium',
    dirs: ['db/migrations', 'services/sessions'],
    has_tests: false,
    labels: ['migration'],
    tags: ['feature', 'medium-sized-diff'],
  },
};

show('first attempt (no rollback, no tests):', await precheck(draft));

console.log('\n🤖 agent: reviewer would swipe left. Self-correcting: adding down() rollback + migration test…');

show('second attempt (rollback + tests added):', {
  ...(await precheck({
    ...draft,
    title: 'feat: drop unused user_events table — with rollback + migration test',
    summary:
      'Migration that drops the legacy user_events table, with a down() rollback restoring it from archive and a migration test running up/down against a scratch database.',
    fingerprint: { ...draft.fingerprint, has_tests: true },
  })),
});

console.log('\n🤖 agent: opening the PR the reviewer will actually approve. 💚');
