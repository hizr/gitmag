import { useState, useEffect, type ReactNode } from 'react';
import { Box, Text, useStdout, useInput } from 'ink';
import type { RepoEntry, CommitEntry, ChangedFile } from '../data/mockRepos.js';

interface FileDiffScreenProps {
  repo: RepoEntry;
  commit: CommitEntry;
  file: ChangedFile;
  getDiff: () => Promise<string>;
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
  lineNumber: number;
  showLineNumbers: boolean;
}

function DiffLine({ line, lineNumber, showLineNumbers }: DiffLineProps) {
  const lineNumStr = showLineNumbers ? `${String(lineNumber).padStart(4, ' ')} │ ` : '';

  // Color based on line prefix
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return (
      <Text color="green" wrap="truncate-end">
        {lineNumStr}
        {line}
      </Text>
    );
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return (
      <Text color="red" wrap="truncate-end">
        {lineNumStr}
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
      {lineNumStr}
      {line}
    </Text>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FileDiffScreen({ repo, commit, file, getDiff, onBack }: FileDiffScreenProps) {
  const { stdout } = useStdout();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  // ── State ────────────────────────────────────────────────────────────
  const [diffScroll, setDiffScroll] = useState(0);
  const [diffContent, setDiffContent] = useState<string | null>(file.diff || null);
  const [loading, setLoading] = useState(!file.diff);
  const [error, setError] = useState<string | null>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  // ── Layout dimensions ────────────────────────────────────────────────
  const availableRows = termRows - 4; // header (2) + footer (2)
  const panelHeight = Math.max(availableRows, 5);
  const innerH = panelHeight - 2;

  // ── Load diff on mount if not already loaded ──────────────────────────
  useEffect(() => {
    if (file.diff) {
      // Diff already available from props
      setDiffContent(file.diff);
      setLoading(false);
      return;
    }

    // Lazy-load the diff
    const loadDiff = async () => {
      try {
        const diff = await getDiff();
        setDiffContent(diff);
        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load diff';
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadDiff();
  }, [file.diff, getDiff]);

  // ── Build diff lines ─────────────────────────────────────────────────
  const diffLines = diffContent ? diffContent.split('\n') : [];
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

    if (input === 'l') {
      setShowLineNumbers((p) => !p);
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
        {loading ? (
          <>
            <Box marginY={Math.floor((innerH - 1) / 2)}>
              <Text color="cyan">Loading diff…</Text>
            </Box>
            {Array.from({ length: Math.max(innerH - 1, 0) }).map((_, i) => (
              <Text key={`loading-${i}`}> </Text>
            ))}
          </>
        ) : error ? (
          <>
            <Box marginY={Math.floor((innerH - 1) / 2)}>
              <Text color="red">{error}</Text>
            </Box>
            {Array.from({ length: Math.max(innerH - 1, 0) }).map((_, i) => (
              <Text key={`error-${i}`}> </Text>
            ))}
          </>
        ) : diffContent ? (
          <>
            {visibleLines.map((line, i) => (
              <DiffLine
                key={`diff-${i}`}
                line={line}
                lineNumber={diffScroll + i + 1}
                showLineNumbers={showLineNumbers}
              />
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
        <Box flexGrow={1}>
          <Text color="gray" dimColor>
            [j/k] scroll [l] toggle line# [bksp] back [q] quit
          </Text>
        </Box>
        <Text color="gray" dimColor>
          {diffScroll + 1}–{Math.min(diffScroll + innerH, diffLines.length)} / {diffLines.length}
        </Text>
      </Box>
    </Box>
  );
}
