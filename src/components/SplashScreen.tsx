import { useEffect, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import { Spinner } from '@inkjs/ui';

// ---------------------------------------------------------------------------
// ASCII art — each letter is 6 rows tall
// Letters: g  i  t  m  a  g
// ---------------------------------------------------------------------------

const ASCII_LETTERS: Record<string, string[]> = {
  g: [' ██████╗ ', '██╔════╝ ', '██║  ███╗', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  i: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
  t: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
  m: ['███╗   ███╗', '████╗ ████║', '██╔████╔██║', '██║╚██╔╝██║', '██║ ╚═╝ ██║', '╚═╝     ╚═╝'],
  a: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
};

// Word order: g i t m a g
const WORD: string[] = ['g', 'i', 't', 'm', 'a', 'g'];
const ASCII_ROWS = 6;
const SCRAMBLE_CHARS = '@#$%!?*^~<>|/\\=+[]{}';
const STATUS_MESSAGES = [
  'Scanning repositories...',
  'Indexing commits...',
  'Analyzing activity...',
  'Preparing digest...',
];

// Resolve times (ms) for each letter — spread evenly across 0–2200ms
const RESOLVE_TIMES = [200, 600, 1000, 1400, 1800, 2200];

const ANIM_INTERVAL_MS = 80;
const STATUS_INTERVAL_MS = 700;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomChar(): string {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)] ?? '@';
}

function scrambledRows(letterKey: string): string[] {
  const template = ASCII_LETTERS[letterKey] ?? ASCII_LETTERS['g']!;
  return template.map((row) =>
    row
      .split('')
      .map((ch) => (ch === ' ' ? ' ' : randomChar()))
      .join('')
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const { stdout } = useStdout();
  const termCols = stdout.columns ?? 80;

  // Per-letter display rows (6 strings each)
  const [letterRows, setLetterRows] = useState<string[][]>(() =>
    WORD.map((letter) => scrambledRows(letter))
  );
  const [resolved, setResolved] = useState<boolean[]>(() => WORD.map(() => false));
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    // Fire onComplete after exact duration
    const doneTimer = setTimeout(() => {
      onComplete();
    }, duration);

    // Animation tick — resolves and scrambles letters
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

    // Status message cycle
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL_MS);

    return () => {
      clearTimeout(doneTimer);
      clearInterval(animTimer);
      clearInterval(statusTimer);
    };
  }, [onComplete, duration]);

  // Measure total art width for centering hint
  const totalArtWidth = WORD.reduce((sum, letter, idx) => {
    const width = (ASCII_LETTERS[letter]?.[0] ?? '').length;
    return sum + width + (idx < WORD.length - 1 ? 1 : 0); // +1 for gap
  }, 0);

  return (
    <Box
      width={termCols}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      paddingY={4}
    >
      {/* ASCII art block */}
      <Box flexDirection="column" alignItems="center">
        {Array.from({ length: ASCII_ROWS }, (_, rowIdx) => (
          <Box key={rowIdx} flexDirection="row">
            {WORD.map((letter, letterIdx) => {
              const isResolved = resolved[letterIdx] ?? false;
              const rowText = (letterRows[letterIdx] ?? [])[rowIdx] ?? '';
              const gap = letterIdx < WORD.length - 1 ? ' ' : '';
              return (
                <Text
                  key={`${letter}-${letterIdx}-${rowIdx}`}
                  color={isResolved ? 'cyan' : 'green'}
                  dimColor={!isResolved}
                >
                  {rowText + gap}
                </Text>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Spacing */}
      <Box marginTop={2} />

      {/* Spinner + cycling status text */}
      <Box flexDirection="row" gap={1}>
        <Spinner />
        <Text color="white" dimColor>
          {STATUS_MESSAGES[statusIndex] ?? STATUS_MESSAGES[0]}
        </Text>
      </Box>

      {/* Invisible width anchor to prevent layout collapse */}
      <Box marginTop={1}>
        <Text dimColor>{' '.repeat(Math.max(0, totalArtWidth))}</Text>
      </Box>
    </Box>
  );
}
