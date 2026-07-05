import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { PRProfile, SwipeVerdict } from '../../shared/types';
import PRCard from './PRCard';

export interface SwipeDeckHandle {
  /** Programmatic swipe (buttons / keyboard) with the same fly-out animation. */
  swipe(verdict: SwipeVerdict): void;
}

interface Props {
  prs: PRProfile[];
  onVerdict(pr: PRProfile, verdict: SwipeVerdict): void;
}

const SWIPE_THRESHOLD = 110;
const SKIP_THRESHOLD = 90;
const FLY_MS = 320;

interface DragState {
  dx: number;
  dy: number;
  dragging: boolean;
  flying: SwipeVerdict | null;
}

const IDLE: DragState = { dx: 0, dy: 0, dragging: false, flying: null };

const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(function SwipeDeck({ prs, onVerdict }, ref) {
  const [drag, setDrag] = useState<DragState>(IDLE);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const intent = useRef<'none' | 'drag' | 'scroll'>('none');
  const busy = useRef(false);

  const top = prs[0];

  const flyOut = useCallback(
    (verdict: SwipeVerdict) => {
      if (!top || busy.current) return;
      busy.current = true;
      setDrag((d) => ({ ...d, dragging: false, flying: verdict }));
      window.setTimeout(() => {
        busy.current = false;
        setDrag(IDLE);
        onVerdict(top, verdict);
      }, FLY_MS);
    },
    [top, onVerdict],
  );

  useImperativeHandle(ref, () => ({ swipe: flyOut }), [flyOut]);

  if (!top) return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy.current || e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    intent.current = 'none';
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current || busy.current || e.pointerId !== start.current.id) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (intent.current === 'none') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Horizontal movement grabs the card; vertical movement scrolls the
      // profile natively (skip lives on the ↑ key / action button instead).
      if (Math.abs(dx) > Math.abs(dy)) {
        intent.current = 'drag';
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        intent.current = 'scroll';
        return;
      }
    }
    if (intent.current !== 'drag') return;
    setDrag({ dx, dy: Math.max(-40, Math.min(dy, 40)), dragging: true, flying: null });
  };

  const settle = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current || e.pointerId !== start.current.id) return;
    const wasDrag = intent.current === 'drag';
    start.current = null;
    intent.current = 'none';
    if (!wasDrag || busy.current) return;

    if (drag.dx > SWIPE_THRESHOLD) flyOut('approve');
    else if (drag.dx < -SWIPE_THRESHOLD) flyOut('reject');
    else setDrag(IDLE);
  };

  const { dx, dy, dragging, flying } = drag;
  const flyTransform =
    flying === 'approve'
      ? 'translate(120vw, -8vh) rotate(24deg)'
      : flying === 'reject'
        ? 'translate(-120vw, -8vh) rotate(-24deg)'
        : flying === 'skip'
          ? 'translate(0, -120vh) rotate(0deg)'
          : flying === 'superlike'
            ? 'translate(0, -130vh) scale(1.15) rotate(0deg)'
            : null;

  const style: React.CSSProperties = {
    transform: flyTransform ?? `translate(${dx}px, ${dy}px) rotate(${dx * 0.055}deg)`,
    transition: dragging ? 'none' : `transform ${flying ? FLY_MS : 260}ms ease`,
    zIndex: 10,
  };

  const likeOpacity = flying === 'approve' ? 1 : Math.min(1, Math.max(0, dx / SWIPE_THRESHOLD));
  const nopeOpacity = flying === 'reject' ? 1 : Math.min(1, Math.max(0, -dx / SWIPE_THRESHOLD));
  const skipOpacity =
    flying === 'skip' ? 1 : Math.min(1, Math.max(0, -dy / SKIP_THRESHOLD)) * (Math.abs(dx) < 40 ? 1 : 0);
  // Superlike is button/keyboard-only (no drag gesture), so it's just on or off.
  const superOpacity = flying === 'superlike' ? 1 : 0;

  return (
    <div className="deck">
      {prs
        .slice(0, 3)
        .map((pr, i) => {
          if (i === 0) {
            return (
              <div
                key={pr.id}
                className="deck-card top"
                style={style}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={settle}
                onPointerCancel={settle}
              >
                <span className="stamp like" style={{ opacity: likeOpacity }}>
                  APPROVE
                </span>
                <span className="stamp nope" style={{ opacity: nopeOpacity }}>
                  NOPE
                </span>
                <span className="stamp skip" style={{ opacity: skipOpacity }}>
                  SKIP
                </span>
                <span className="stamp super" style={{ opacity: superOpacity }}>
                  ⭐ SUPER
                </span>
                <PRCard pr={pr} />
              </div>
            );
          }
          return (
            <div
              key={pr.id}
              className="deck-card under"
              style={{
                transform: `translateY(${i * 14}px) scale(${1 - i * 0.045})`,
                zIndex: 10 - i,
                opacity: 1 - i * 0.25,
              }}
            >
              <PRCard pr={pr} />
            </div>
          );
        })}
    </div>
  );
});

export default SwipeDeck;
