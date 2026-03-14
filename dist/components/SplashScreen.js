import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useRef, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Spinner } from '@inkjs/ui';
// ---------------------------------------------------------------------------
// ASCII art — each letter is 6 rows tall
// Letters: g  i  t  m  a  g
// ---------------------------------------------------------------------------
const ASCII_LETTERS = {
  g: [' ██████╗ ', '██╔════╝ ', '██║  ███╗', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  i: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
  t: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
  m: ['███╗   ███╗', '████╗ ████║', '██╔████╔██║', '██║╚██╔╝██║', '██║ ╚═╝ ██║', '╚═╝     ╚═╝'],
  a: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
};
// Word order: g i t m a g
const WORD = ['g', 'i', 't', 'm', 'a', 'g'];
const ASCII_ROWS = 6;
const SCRAMBLE_CHARS = '@#$%!?*^~<>|/\\=+[]{}';
// Resolve times (ms) for each letter — spread evenly across 0–2200ms
const RESOLVE_TIMES = [200, 600, 1000, 1400, 1800, 2200];
const ANIM_INTERVAL_MS = 80;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)] ?? '@';
}
function scrambledRows(letterKey) {
  const template = ASCII_LETTERS[letterKey] ?? ASCII_LETTERS['g'];
  return template.map((row) =>
    row
      .split('')
      .map((ch) => (ch === ' ' ? ' ' : randomChar()))
      .join('')
  );
}
export function SplashScreen({ onComplete, duration = 3000, scanProgress }) {
  const { stdout } = useStdout();
  const termCols = stdout.columns ?? 80;
  // Per-letter display rows (6 strings each)
  const [letterRows, setLetterRows] = useState(() => WORD.map((letter) => scrambledRows(letter)));
  const [resolved, setResolved] = useState(() => WORD.map(() => false));
  // True once the animation has played through its full duration
  const [animationDone, setAnimationDone] = useState(false);
  // Stable ref so the scan-done effect always sees the latest onComplete
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Animation effect — runs scramble/resolve, then freezes at duration
  useEffect(() => {
    const startTime = Date.now();
    const animTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setResolved((prev) =>
        prev.map((wasResolved, idx) => {
          const resolveAt = RESOLVE_TIMES[idx] ?? 0;
          return wasResolved || elapsed >= resolveAt;
        })
      );
      setLetterRows((_prev) =>
        WORD.map((letter, idx) => {
          const resolveAt = RESOLVE_TIMES[idx] ?? 0;
          const now = Date.now() - startTime;
          return now >= resolveAt
            ? (ASCII_LETTERS[letter] ?? scrambledRows(letter))
            : scrambledRows(letter);
        })
      );
    }, ANIM_INTERVAL_MS);
    // Mark animation complete after duration; clear anim interval — frame freezes
    const doneTimer = setTimeout(() => {
      clearInterval(animTimer);
      // Ensure all letters are fully resolved in the frozen frame
      setResolved(WORD.map(() => true));
      setLetterRows(WORD.map((letter) => ASCII_LETTERS[letter] ?? scrambledRows(letter)));
      setAnimationDone(true);
    }, duration);
    return () => {
      clearTimeout(doneTimer);
      clearInterval(animTimer);
    };
  }, [duration]);
  // Gate onComplete: fire only when both animation AND scan are done
  useEffect(() => {
    if (animationDone && scanProgress.done) {
      onCompleteRef.current();
    }
  }, [animationDone, scanProgress.done]);
  // Measure total art width for centering hint
  const totalArtWidth = WORD.reduce((sum, letter, idx) => {
    const width = (ASCII_LETTERS[letter]?.[0] ?? '').length;
    return sum + width + (idx < WORD.length - 1 ? 1 : 0); // +1 for gap
  }, 0);
  return _jsxs(Box, {
    width: termCols,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingY: 4,
    children: [
      _jsx(Box, {
        flexDirection: 'column',
        alignItems: 'center',
        children: Array.from({ length: ASCII_ROWS }, (_, rowIdx) =>
          _jsx(
            Box,
            {
              flexDirection: 'row',
              children: WORD.map((letter, letterIdx) => {
                const isResolved = resolved[letterIdx] ?? false;
                const rowText = (letterRows[letterIdx] ?? [])[rowIdx] ?? '';
                const gap = letterIdx < WORD.length - 1 ? ' ' : '';
                return _jsx(
                  Text,
                  {
                    color: isResolved ? 'cyan' : 'green',
                    dimColor: !isResolved,
                    children: rowText + gap,
                  },
                  `${letter}-${letterIdx}-${rowIdx}`
                );
              }),
            },
            rowIdx
          )
        ),
      }),
      _jsx(Box, { marginTop: 2 }),
      _jsxs(Box, {
        flexDirection: 'row',
        gap: 1,
        children: [
          _jsx(Spinner, {}),
          _jsx(Text, { color: 'white', dimColor: true, children: scanProgress.phase }),
        ],
      }),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(Text, { dimColor: true, children: ' '.repeat(Math.max(0, totalArtWidth)) }),
      }),
    ],
  });
}
//# sourceMappingURL=SplashScreen.js.map
