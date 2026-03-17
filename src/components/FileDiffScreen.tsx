import { useState, type ReactNode } from 'react';
import { Box, Text, useStdout, useInput } from 'ink';
import type { RepoEntry, CommitEntry, ChangedFile } from '../data/mockRepos.js';

interface FileDiffScreenProps {
  repo: RepoEntry;
  commit: CommitEntry;
  file: ChangedFile;
  onBack: () => void;
}

// ── Panel border helper ───────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  width: number;
  height: number;
  children: ReactNode;
}

function Panel({ label, width, height, children }: PanelProps) {
  const borderColor = 'cyan'; // Always focused
  const innerWidth = Math.max(width - 4, 1);
  const innerHeight = Math.max(height - 2, 1);

  const topBar = '━'.repeat(Math.max(innerWidth - label.length - 2, 0));
  const top = `┏━ ${label} ${topBar}┓`;
  const bottom = `┗${'━'.repeat(innerWidth + 2)}┛`;

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Text color={borderColor}>{top}</Text>
      <Box flexDirection="row" height={innerHeight}>
        <Text color={borderColor}>{'┃'}</Text>
        <Box flexDirection="column" width={innerWidth} overflow="hidden">
          {children}
        </Box>
        <Text color={borderColor}>{'┃'}</Text>
      </Box>
      <Text color={borderColor}>{bottom}</Text>
    </Box>
  );
}

// ── Diff line renderer ────────────────────────────────────────────────────────

interface DiffLineProps {
  line: string;
}

function DiffLine({ line }: DiffLineProps) {
  // Color based on line prefix
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return (
      <Text color="green" wrap="truncate-end">
        {line}
      </Text>
    );
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return (
      <Text color="red" wrap="truncate-end">
        {line}
      </Text>
    );
  }
  if (line.startsWith('@@')) {
    return (
      <Text color="cyan" wrap="truncate-end">
        {line}
      </Text>
    );
  }
  // Context lines (default color, dimmed if desired)
  return (
    <Text color="gray" wrap="truncate-end">
      {line}
    </Text>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FileDiffScreen({ repo, commit, file, onBack }: FileDiffScreenProps) {
  const { stdout } = useStdout();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  // ── State ────────────────────────────────────────────────────────────
  const [diffScroll, setDiffScroll] = useState(0);

  // ── Layout dimensions ────────────────────────────────────────────────
  const availableRows = termRows - 4; // header (2) + footer (2)
  const panelHeight = Math.max(availableRows, 5);
  const innerH = panelHeight - 2;

  // ── Build diff lines ─────────────────────────────────────────────────
  const diffLines = file.diff ? file.diff.split('\n') : [];
  const visibleLines = diffLines.slice(diffScroll, diffScroll + innerH);

  // ── Keyboard input ───────────────────────────────────────────────────
  useInput((input, key) => {
    if (input === 'q') {
      // handled by app, but guard here too
      return;
    }

    if (key.backspace || key.delete) {
      onBack();
      return;
    }

    const up = key.upArrow || input === 'k';
    const down = key.downArrow || input === 'j';

    if (up) {
      setDiffScroll((p) => Math.max(p - 1, 0));
    }
    if (down) {
      setDiffScroll((p) => {
        const next = p + 1;
        return next >= p + innerH
          ? next - innerH + 1
          : Math.min(next, Math.max(diffLines.length - innerH, 0));
      });
    }
  });

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Box flexDirection="column" width={termCols} height={termRows} paddingX={1}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <Box marginBottom={0}>
        <Text bold color="cyan">
          gitmag
        </Text>
        <Text color="gray"> › </Text>
        <Text color="yellow">{repo.path}</Text>
        <Text color="gray"> › </Text>
        <Text color="white">commits</Text>
        <Text color="gray"> › </Text>
        <Text color="green">{commit.hash.slice(0, 7)}</Text>
        <Text color="gray"> — </Text>
        <Text color="cyan">{file.path}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(termCols - 2)}</Text>
      </Box>

      {/* ── Diff panel ────────────────────────────────────────────────── */}
      <Panel label="File Diff" width={termCols - 2} height={panelHeight}>
        {file.diff ? (
          <>
            {visibleLines.map((line, i) => (
              <DiffLine key={`diff-${i}`} line={line} />
            ))}
            {/* Empty rows to fill panel height */}
            {Array.from({ length: Math.max(innerH - visibleLines.length, 0) }).map((_, i) => (
              <Text key={`empty-${i}`}> </Text>
            ))}
          </>
        ) : (
          <>
            <Box marginY={Math.floor((innerH - 1) / 2)}>
              <Text color="gray" dimColor>
                No diff available for this file
              </Text>
            </Box>
            {Array.from({ length: Math.max(innerH - 1, 0) }).map((_, i) => (
              <Text key={`empty-nodiff-${i}`}> </Text>
            ))}
          </>
        )}
      </Panel>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <Box marginTop={0}>
        <Text color="gray" dimColor>
          [j/k] scroll [bksp] back [q] quit
        </Text>
      </Box>
    </Box>
  );
}
