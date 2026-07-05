/**
 * Offline profile pipeline: run a gstack-style review over each demo PR with
 * the Claude Agent SDK and write server/data/cards.json — green/red flags and
 * risk notes become part of the card. Never runs in the request path.
 *
 *   ANTHROPIC_API_KEY=… npm run precompute
 *
 * Model: Opus 4.8 per the plan — strong bug-finding, latency irrelevant
 * offline, and (unlike Fable 5) no cyber-safety classifier that could refuse
 * the C001 IDOR analysis mid-demo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PRProfile } from '../shared/types';
import { mockPRs } from '../server/mock';

const MODEL = process.env.GHEART_REVIEW_MODEL || 'claude-opus-4-8';
const OUT = path.resolve(process.cwd(), 'server/data/cards.json');

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    greenFlags: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    redFlags: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    riskNote: { type: 'string' },
  },
  required: ['greenFlags', 'redFlags'],
  additionalProperties: false,
} as const;

interface Findings {
  greenFlags: string[];
  redFlags: string[];
  riskNote?: string;
}

function reviewPrompt(pr: PRProfile): string {
  return [
    'You are reviewing a pull request the way the gstack /review and /cso skills do:',
    'find real correctness and security problems, and note genuinely good practice.',
    'If the gstack review skills are available, use them on this task.',
    '',
    `Title: ${pr.title}`,
    `Author: ${pr.author.login} · ${pr.repo}#${pr.number}`,
    `Stats: +${pr.stats.additions}/−${pr.stats.deletions} across ${pr.stats.changedFiles} files, CI ${pr.ci}`,
    `Files: ${pr.topFiles.map((f) => `${f.path} (+${f.additions}/−${f.deletions})`).join(', ')}`,
    `Description: ${pr.tldr}`,
    '',
    'Return findings only: concrete greenFlags and redFlags (max 4 each),',
    'each a single reviewer-facing sentence, plus an optional one-line riskNote.',
    'Calibrate severity: a redFlag means "I would block this merge until it is',
    'addressed" — style nits, hypotheticals, and process advice do not qualify.',
    'Most healthy PRs have ZERO red flags; return an empty array rather than',
    'padding. Do not treat the maximum as a quota.',
  ].join('\n');
}

async function reviewWithAgent(pr: PRProfile): Promise<Findings | null> {
  // Loaded dynamically so the app itself never depends on the SDK being installed.
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  for await (const msg of query({
    prompt: reviewPrompt(pr),
    options: {
      model: MODEL,
      settingSources: ['user', 'project'], // loads ~/.claude/skills/gstack when present
      mcpServers: process.env.GHEART_GBRAIN_MCP
        ? { gbrain: { command: 'gbrain', args: ['serve', '--stdio'] } }
        : {},
      allowedTools: ['Read', 'Grep', 'Bash', 'mcp__gbrain__*'],
      outputFormat: { type: 'json_schema', schema: FINDINGS_SCHEMA },
    } as never,
  })) {
    const m = msg as { type: string; subtype?: string; structured_output?: unknown; result?: string };
    if (m.type === 'result' && m.subtype === 'success') {
      const out = m.structured_output ?? safeParse(m.result);
      if (out && typeof out === 'object') return out as Findings;
    }
  }
  return null;
}

function safeParse(text?: string): unknown {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  try {
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

const repo = process.env.GHEART_REPO || 'demo/lovable-app';
const cards = mockPRs(repo);
console.log(`precomputing ${cards.length} cards with ${MODEL}…`);

for (const pr of cards) {
  try {
    const findings = await reviewWithAgent(pr);
    if (findings) {
      // Agent findings replace the hand-written flags; hand-written ones stay
      // as the fallback when a review comes back empty (cut line #1).
      pr.greenFlags = findings.greenFlags.length ? findings.greenFlags : pr.greenFlags;
      pr.redFlags = findings.redFlags.length ? findings.redFlags : pr.redFlags;
      console.log(`  ✓ #${pr.number} ${pr.title} (${findings.redFlags.length} red flags)`);
    } else {
      console.log(`  – #${pr.number} no structured findings, keeping hand-written flags`);
    }
  } catch (err) {
    console.error(`  ✗ #${pr.number} review failed, keeping hand-written flags:`, err);
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(cards, null, 2), 'utf8');
console.log(`wrote ${OUT} — demo mode now serves these cards.`);
