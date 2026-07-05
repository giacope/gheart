/**
 * Loop-closure seed: pre-load the brain with the C002-iter1 rejection so the
 * C002-iter2 card (#414 in the demo deck) arrives with a high learned score
 * citing this memory.
 *
 *   npm run seed:brain
 */
import { createBrainStore, type DecisionRecord } from '../server/brain';

const REPO = process.env.GHEART_REPO || 'demo/lovable-app';

const SEED_DECISIONS: DecisionRecord[] = [
  {
    type: 'review-decision',
    verdict: 'reject',
    repo: REPO,
    pr: 412,
    title: 'feat: drop legacy sessions table',
    author: 'schema-shepherd',
    reasons: ['no-tests'],
    fingerprint: {
      size: 'medium',
      dirs: ['db/migrations', 'services/sessions'],
      has_tests: false,
      labels: ['migration'],
      tags: ['feature', 'medium-sized-diff'],
      ci: 'passing',
    },
    tldr: 'Drops the legacy sessions table. No rollback path for the schema drop and no migration test — an irreversible destructive migration.',
    url: `https://github.com/${REPO}/pull/412`,
    swiped_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
];

const brain = await createBrainStore();
for (const d of SEED_DECISIONS) {
  await brain.captureDecision(d);
  console.log(`seeded: ${d.verdict} ${d.repo}#${d.pr} (${d.reasons.join(', ') || 'no reasons'})`);
}
console.log('brain seeded — deal the deck and watch #414 cite #412.');
