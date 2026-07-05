import { useEffect, useRef, useState } from 'react';
import type { TerminalFrame } from '../../shared/types';

function lineClass(text: string): string {
  if (text.startsWith('$ ')) return 'term-line term-cmd';
  if (text.startsWith('✓')) return 'term-line term-ok';
  if (text.startsWith('✗')) return 'term-line term-err';
  if (text.startsWith('▸')) return 'term-line term-note';
  return 'term-line term-out';
}

function renderLine(text: string) {
  if (text.startsWith('$ ')) {
    return (
      <>
        <span className="term-prompt">$</span> {text.slice(2)}
      </>
    );
  }
  return text;
}

/**
 * Plays a scripted CLI session: "$ " lines type out char-by-char, output lines
 * print instantly, and the whole thing loops. Timers are torn down on unmount
 * and restart when the frames change (the deck recycles card instances).
 */
export default function TerminalPlayer({ frames, cols = 48 }: { frames: TerminalFrame[]; cols?: number }) {
  const [lines, setLines] = useState<string[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = window.setTimeout(resolve, ms);
        timers.current.push(t);
      });

    async function run() {
      while (!cancelled) {
        setLines([]);
        setTyping(null);
        const printed: string[] = [];
        for (const f of frames) {
          if (cancelled) return;
          if (f.text.startsWith('$ ')) {
            for (let i = 2; i <= f.text.length; i++) {
              if (cancelled) return;
              setTyping(f.text.slice(0, i));
              await wait(26);
            }
            printed.push(f.text);
            setTyping(null);
            setLines([...printed]);
          } else {
            printed.push(f.text);
            setLines([...printed]);
          }
          await wait(f.delayMs);
        }
        await wait(1500);
      }
    }
    void run();

    return () => {
      cancelled = true;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [frames]);

  return (
    <div className="hero-terminal" style={{ ['--term-cols' as string]: String(cols) }}>
      <div className="term-chrome" aria-hidden>
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-chrome-title">zsh</span>
      </div>
      <div className="term-body">
        {lines.map((l, i) => (
          <div key={i} className={lineClass(l)}>
            {renderLine(l)}
          </div>
        ))}
        {typing !== null && (
          <div className={lineClass(typing)}>
            {renderLine(typing)}
            <span className="term-cursor" />
          </div>
        )}
        {typing === null && <span className="term-cursor" />}
      </div>
    </div>
  );
}
