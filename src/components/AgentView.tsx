import { useEffect, useState } from 'react';
import type { PrecheckMemory, PrecheckRequest, PrecheckResponse } from '../../shared/types';
import { precheck } from '../api';

// The exact draft scripts/precheck-demo.ts opens with: an agent about to drop
// the legacy user_events table with no rollback and no migration test.
const DRAFT: PrecheckRequest = {
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

// The self-corrected draft: same change, now with a down() rollback + a
// migration test running up/down against a scratch database.
const PATCHED: PrecheckRequest = {
  ...DRAFT,
  title: 'feat: drop unused user_events table — with rollback + migration test',
  summary:
    'Migration that drops the legacy user_events table, with a down() rollback restoring it from archive and a migration test running up/down against a scratch database.',
  fingerprint: { ...DRAFT.fingerprint, has_tests: true },
};

interface Props {
  onClose: () => void;
}

/**
 * The execution-layer moment, on screen: an agent about to open a PR asks the
 * brain FIRST, is told the reviewer would reject it, patches its own diff, and
 * asks again — flipping to approve. Every step hits the live /api/precheck.
 */
export default function AgentView({ onClose }: Props) {
  const [first, setFirst] = useState<PrecheckResponse | null>(null);
  const [second, setSecond] = useState<PrecheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [retrying, setRetrying] = useState(false);

  // Step 1: on mount, the agent asks the brain about its first attempt.
  useEffect(() => {
    let live = true;
    precheck(DRAFT)
      .then((r) => {
        if (!live) return;
        setFirst(r);
        setError(null);
      })
      .catch((err: Error) => {
        if (live) setError(err.message);
      })
      .finally(() => {
        if (live) setLoadingFirst(false);
      });
    return () => {
      live = false;
    };
  }, []);

  // Step 2: the agent patches its own diff (down() rollback + test) and asks again.
  const selfCorrect = () => {
    setRetrying(true);
    setError(null);
    precheck(PATCHED)
      .then((r) => setSecond(r))
      .catch((err: Error) => setError(err.message))
      .finally(() => setRetrying(false));
  };

  return (
    <div className="brain-overlay" role="dialog" aria-label="Agent pre-check against the brain">
      <aside className="brain-panel agent-panel">
        <header className="brain-panel-head">
          <h2>🤖 Agent pre-check</h2>
          <button className="brain-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="agent-console">
          <p className="agent-line">
            <span className="agent-prompt">🤖 agent:</span> about to open a PR that drops the
            user_events table…
          </p>

          <DraftCard req={DRAFT} />

          {loadingFirst ? (
            <p className="agent-waiting">asking the brain…</p>
          ) : error && !first ? (
            <p className="agent-error error-text">💔 precheck failed: {error}</p>
          ) : first ? (
            <PrecheckResult label="first attempt · no rollback, no tests" r={first} />
          ) : null}

          {first && first.predictedVerdict === 'reject' && !second && (
            <div className="agent-actions">
              <p className="agent-line">
                <span className="agent-prompt">🤖 agent:</span> reviewer would swipe left.
                Self-correcting: adding down() rollback + migration test…
              </p>
              <button className="agent-retry" onClick={selfCorrect} disabled={retrying}>
                {retrying ? 'retrying…' : '🔧 self-correct & retry'}
              </button>
            </div>
          )}

          {second && (
            <>
              <DraftCard req={PATCHED} />
              <PrecheckResult label="second attempt · rollback + tests added" r={second} />
              {second.predictedVerdict === 'approve' && (
                <p className="agent-line agent-final">
                  <span className="agent-prompt">🤖 agent:</span> opening the PR the reviewer will
                  actually approve. 💚
                </p>
              )}
            </>
          )}

          {error && (first || second) && (
            <p className="agent-error error-text">💔 {error}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

/** The diff the agent is about to open — its title and prose summary. */
function DraftCard({ req }: { req: PrecheckRequest }) {
  return (
    <div className="agent-draft">
      <div className="agent-draft-title">{req.title}</div>
      <p className="agent-draft-summary">{req.summary}</p>
    </div>
  );
}

/** What the brain answered: predicted verdict, the memories it cited, and its advice. */
function PrecheckResult({ label, r }: { label: string; r: PrecheckResponse }) {
  return (
    <div className={`agent-result ${r.predictedVerdict}`}>
      <div className="agent-result-head">
        <span className="agent-result-label">{label}</span>
        <span className={`agent-verdict ${r.predictedVerdict}`}>
          predicted {r.predictedVerdict}
          <span className="agent-confidence">confidence {r.confidence}</span>
        </span>
      </div>

      {r.memories.length > 0 && (
        <div className="agent-memories">
          {r.memories.map((m) => (
            <MemoryLine key={`${m.pr}-${m.reason}`} m={m} />
          ))}
        </div>
      )}

      <p className="agent-advice">{r.advice}</p>
    </div>
  );
}

function MemoryLine({ m }: { m: PrecheckMemory }) {
  return (
    <div className={`agent-memory ${m.verdict}`}>
      <span className="agent-memory-verdict">{m.verdict === 'reject' ? '💔' : '💚'}</span>
      <a href={m.url} target="_blank" rel="noreferrer" className="agent-memory-link">
        #{m.pr} — {m.reason}
      </a>
    </div>
  );
}
