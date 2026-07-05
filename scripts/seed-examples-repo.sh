#!/usr/bin/env bash
#
# Create a throwaway GitHub repo full of example PRs — two per preview kind —
# so gheart has real pull requests that exercise every branch of its preview
# generator (frontend, cli, api, migration, docs, tests, generic).
#
# Reproducible: the repo name gets a unique hash suffix, so you can run it as
# many times as you like without collisions.
#
#   ./scripts/seed-examples-repo.sh                 # random hash
#   GHEART_EXAMPLES_HASH=demo1 ./scripts/seed-examples-repo.sh
#   GHEART_EXAMPLES_VISIBILITY=private ./scripts/seed-examples-repo.sh
#
# Requires: gh (authenticated), git.
set -euo pipefail

command -v gh  >/dev/null || { echo "need the GitHub CLI (gh)"; exit 1; }
command -v git >/dev/null || { echo "need git"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "run 'gh auth login' first"; exit 1; }

OWNER="$(gh api user -q .login)"
HASH="${GHEART_EXAMPLES_HASH:-$(openssl rand -hex 3)}"
NAME="${GHEART_EXAMPLES_PREFIX:-gheart-preview-examples}-${HASH}"
VIS="${GHEART_EXAMPLES_VISIBILITY:-public}"
SLUG="$OWNER/$NAME"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

echo "▸ seeding $SLUG ($VIS) in $WORK"

# ---------------------------------------------------------------------------
# Base project — a small but real Vite/React app plus cli/server/db/docs/lib
# scaffolding, so each example PR is a plausible diff in the right directory.
# ---------------------------------------------------------------------------
git init -q -b main
mkdir -p src/components src/styles cli/commands server/routes db/migrations lib docs tests

cat > README.md <<'EOF'
# gheart preview examples

A throwaway app that exists to exercise **gheart**'s PR-preview generator. Every
open pull request here is a different *kind* of change — frontend, CLI, API, DB
migration, docs, tests — so gheart renders a different preview for each one.

Point gheart at this repo (repo picker, or `GHEART_REPO=<owner>/<name>`) and swipe.

Regenerate a fresh copy any time with `scripts/seed-examples-repo.sh` in the
gheart repo.
EOF

cat > package.json <<'EOF'
{
  "name": "gheart-preview-examples",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "test": "vitest run" },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
EOF

cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>example app</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
EOF

cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
EOF

cat > src/main.tsx <<'EOF'
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';
createRoot(document.getElementById('root')!).render(<App />);
EOF

cat > src/App.tsx <<'EOF'
import Button from './components/Button';
import Card from './components/Card';

export default function App() {
  return (
    <main className="app">
      <h1>Acme Console</h1>
      <p>A tiny app that exists to be previewed.</p>
      <Card title="Starter" price="$0" />
      <Card title="Pro" price="$29" />
      <Button label="Get started" />
    </main>
  );
}
EOF

cat > src/components/Button.tsx <<'EOF'
export default function Button({ label }: { label: string }) {
  return <button className="btn">{label}</button>;
}
EOF

cat > src/components/Card.tsx <<'EOF'
export default function Card({ title, price }: { title: string; price: string }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <span className="price">{price}</span>
    </div>
  );
}
EOF

cat > src/styles/app.css <<'EOF'
:root { --brand: #35d07f; }
.app { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; }
.btn { background: var(--brand); color: #06281a; border: 0; border-radius: 10px; padding: 10px 20px; font-weight: 700; }
.card { border: 1px solid #e5e5ea; border-radius: 12px; padding: 16px; margin: 8px 0; }
.price { font-weight: 800; }
EOF

cat > cli/index.ts <<'EOF'
#!/usr/bin/env node
import { hello } from './commands/hello';

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case 'hello':
    hello(args);
    break;
  default:
    console.log('usage: acme <hello> [options]');
}
EOF

cat > cli/commands/hello.ts <<'EOF'
export function hello(args: string[]): void {
  const name = args[0] ?? 'world';
  console.log(`Hello, ${name}!`);
}
EOF

cat > server/routes/orders.ts <<'EOF'
import type { Request, Response } from 'express';

export function listOrders(_req: Request, res: Response): void {
  res.json({ orders: [] });
}
EOF

cat > server/routes/users.ts <<'EOF'
import type { Request, Response } from 'express';

export function listUsers(_req: Request, res: Response): void {
  res.json({ users: [] });
}
EOF

cat > server/db.ts <<'EOF'
export const db = { query: async (_sql: string) => [] as unknown[] };
EOF

cat > db/migrations/001_init.sql <<'EOF'
CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
EOF

cat > lib/config.ts <<'EOF'
export interface Config { port: number; env: string; }
export function loadConfig(): Config {
  return { port: Number(process.env.PORT ?? 3000), env: process.env.NODE_ENV ?? 'dev' };
}
EOF

cat > lib/format.ts <<'EOF'
export function currency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
EOF

cat > docs/guide.md <<'EOF'
# Guide

Placeholder documentation for the example app.
EOF

cat > tests/format.test.ts <<'EOF'
import { describe, expect, it } from 'vitest';
import { currency } from '../lib/format';

describe('currency', () => {
  it('formats cents as dollars', () => {
    expect(currency(1299)).toBe('$12.99');
  });
});
EOF

git add -A
git commit -q -m "chore: scaffold example app"

echo "▸ creating repo…"
gh repo create "$SLUG" --"$VIS" --source=. --remote=origin --push \
  --description "Example PRs for every gheart preview kind (seeded, disposable)" >/dev/null

# ---------------------------------------------------------------------------
# One PR per entry. The classifier routes on the changed file paths, so each
# PR just needs a plausible diff in the right directory.
# ---------------------------------------------------------------------------
commit_pr () { # <branch> <title> <body>
  git add -A
  git commit -q -m "$2"
  git push -q -u origin "$1"
  gh pr create --base main --head "$1" --title "$2" --body "$3" >/dev/null
  printf '  ✓ %s\n' "$2"
}

# ---- frontend ×2 ----
git checkout -q -b feat/dark-mode main
cat > src/components/Toggle.tsx <<'EOF'
import { useState } from 'react';
export default function Toggle() {
  const [on, setOn] = useState(false);
  return <button className={`toggle ${on ? 'on' : ''}`} onClick={() => setOn(!on)}>{on ? '🌙' : '☀️'}</button>;
}
EOF
printf '\n.toggle { border-radius: 999px; padding: 6px 12px; }\n.toggle.on { background: #17171f; color: #fff; }\n' >> src/styles/app.css
commit_pr feat/dark-mode "feat: add a dark mode toggle to the header" "Adds a theme switcher with a sun/moon toggle and persists nothing yet."

git checkout -q -b feat/pricing-cards main
cat >> src/components/Card.tsx <<'EOF'

export function PricingGrid() {
  return <div className="grid">{[1, 2, 3].map((i) => <Card key={i} title={`Tier ${i}`} price={`$${i * 9}`} />)}</div>;
}
EOF
printf '\n.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }\n' >> src/styles/app.css
commit_pr feat/pricing-cards "feat: redesign the pricing section as a 3-up card grid" "Replaces the stacked cards with a responsive grid and adds a Pro tier."

# ---- cli ×2 ----
git checkout -q -b feat/cli-json main
cat > cli/commands/hello.ts <<'EOF'
export function hello(args: string[]): void {
  const json = args.includes('--json');
  const name = args.find((a) => !a.startsWith('--')) ?? 'world';
  if (json) console.log(JSON.stringify({ greeting: `Hello, ${name}!` }));
  else console.log(`Hello, ${name}!`);
}
EOF
commit_pr feat/cli-json "feat: add a --json output flag to the hello command" "Machine-readable output for scripting: acme hello --json."

git checkout -q -b feat/cli-stats main
cat > cli/commands/stats.ts <<'EOF'
export function stats(): void {
  console.log('orders: 128\nusers:  42\nuptime: 99.9%');
}
EOF
cat > cli/index.ts <<'EOF'
#!/usr/bin/env node
import { hello } from './commands/hello';
import { stats } from './commands/stats';

const [cmd, ...args] = process.argv.slice(2);
switch (cmd) {
  case 'hello':
    hello(args);
    break;
  case 'stats':
    stats();
    break;
  default:
    console.log('usage: acme <hello|stats> [options]');
}
EOF
commit_pr feat/cli-stats "feat: add an acme stats subcommand" "New subcommand that prints a quick health summary to the terminal."

# ---- api ×2 ----
git checkout -q -b feat/api-create-order main
cat > server/routes/orders.ts <<'EOF'
import type { Request, Response } from 'express';

export function listOrders(_req: Request, res: Response): void {
  res.json({ orders: [] });
}

export function createOrder(req: Request, res: Response): void {
  const { item } = req.body as { item: string };
  res.status(201).json({ id: 1001, item, ok: true });
}
EOF
commit_pr feat/api-create-order "feat: add POST /api/orders to create an order" "New endpoint that accepts an item and returns the created order as JSON."

git checkout -q -b feat/api-get-user main
cat > server/routes/users.ts <<'EOF'
import type { Request, Response } from 'express';

export function listUsers(_req: Request, res: Response): void {
  res.json({ users: [] });
}

export function getUser(req: Request, res: Response): void {
  res.json({ id: req.params.id, name: 'Ada' });
}
EOF
commit_pr feat/api-get-user "feat: add GET /api/users/:id" "Fetch a single user by id for the profile page."

# ---- migration ×2 ----
git checkout -q -b feat/add-status-column main
cat > db/migrations/002_add_status.sql <<'EOF'
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
CREATE INDEX idx_orders_status ON orders (status);
EOF
commit_pr feat/add-status-column "feat: add a status column to the orders table" "Adds orders.status (default 'pending') plus a supporting index."

git checkout -q -b feat/drop-sessions main
cat > db/migrations/003_drop_sessions.sql <<'EOF'
DROP TABLE IF EXISTS sessions;
EOF
commit_pr feat/drop-sessions "feat: drop the legacy sessions table" "We moved to stateless JWTs, so the sessions table is dead weight."

# ---- docs ×2 ----
git checkout -q -b docs-getting-started main
cat > docs/guide.md <<'EOF'
# Getting started

1. `npm install`
2. `npm run dev`
3. Open http://localhost:5173

## CLI

- `acme hello --json` — greet, machine-readable
- `acme stats` — quick health summary
EOF
commit_pr docs-getting-started "docs: write a real getting-started guide" "Fills in install/run steps and documents the CLI commands."

git checkout -q -b docs-architecture main
cat > docs/architecture.md <<'EOF'
# Architecture

- `src/`     — the Vite/React front end
- `server/`  — HTTP routes
- `cli/`     — the acme command-line tool
- `db/`      — SQL migrations
- `lib/`     — shared helpers

We stay a modular monolith until real scaling pressure shows up.
EOF
commit_pr docs-architecture "docs: document the project architecture" "Adds an ADR-style overview of how the pieces fit together."

# ---- tests ×2 ----
git checkout -q -b test-currency main
cat > tests/currency.test.ts <<'EOF'
import { describe, expect, it } from 'vitest';
import { currency } from '../lib/format';

describe('currency', () => {
  it('handles zero', () => expect(currency(0)).toBe('$0.00'));
  it('rounds to cents', () => expect(currency(199)).toBe('$1.99'));
  it('formats large amounts', () => expect(currency(1234567)).toBe('$12345.67'));
});
EOF
commit_pr test-currency "test: cover the currency formatter edge cases" "Adds boundary tests for zero, rounding, and large amounts."

git checkout -q -b test-config main
cat > tests/config.test.ts <<'EOF'
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../lib/config';

describe('loadConfig', () => {
  it('defaults the port to 3000', () => {
    delete process.env.PORT;
    expect(loadConfig().port).toBe(3000);
  });
});
EOF
commit_pr test-config "test: add coverage for the config loader defaults" "Verifies loadConfig falls back to port 3000 when PORT is unset."

# ---- generic ×2 ----
git checkout -q -b refactor-config main
cat > lib/env.ts <<'EOF'
export function readEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}
EOF
cat > lib/config.ts <<'EOF'
import { readEnv } from './env';
export interface Config { port: number; env: string; }
export function loadConfig(): Config {
  return { port: Number(readEnv('PORT', '3000')), env: readEnv('NODE_ENV', 'dev') };
}
EOF
commit_pr refactor-config "refactor: extract an env helper from the config loader" "Pulls process.env access into lib/env so config is easier to test."

git checkout -q -b perf-format main
cat > lib/format.ts <<'EOF'
const cache = new Map<number, string>();
export function currency(cents: number): string {
  const hit = cache.get(cents);
  if (hit) return hit;
  const out = `$${(cents / 100).toFixed(2)}`;
  cache.set(cents, out);
  return out;
}
EOF
commit_pr perf-format "perf: memoize the currency formatter" "Caches formatted values so hot render paths stop re-computing them."

git checkout -q main >/dev/null 2>&1

echo
echo "✅ done — $(gh pr list --repo "$SLUG" --state open --json number -q 'length') open PRs"
echo "   repo:   https://github.com/$SLUG"
echo "   view:   GITHUB_TOKEN=<pat> GHEART_REPO=$SLUG npm run dev   (or pick it in the repo picker)"
echo "   delete: gh repo delete $SLUG --yes"
