import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Box, Text, useStdout, useInput } from 'ink';
import clipboard from 'clipboardy';
import type { RepoEntry, CommitEntry, ChangedFile } from '../data/mockRepos.js';
import { buildGraphLines } from '../utils/git-graph.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type FocusPanel = 'graph' | 'files';

const FOCUS_ORDER: FocusPanel[] = ['graph', 'files'];

const FILE_STATUS_COLOR: Record<string, string> = {
  A: 'green',
  M: 'yellow',
  D: 'red',
  R: 'cyan',
};

interface CommitScreenProps {
  repo: RepoEntry;
  initialSelectedIdx?: number;
  onBack: () => void;
  onOpenDiff?: (commit: CommitEntry, file: ChangedFile) => void;
}

// ── Panel border helper ───────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  focused: boolean;
  width: number;
  height: number;
  children: ReactNode;
}

function Panel({ label, focused, width, height, children }: PanelProps) {
  const borderColor = focused ? 'cyan' : 'gray';
  // 2 corner chars + 2 side bars = 4 reserved columns; content is inset by 1 on each side
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

// ── Commit row in the graph panel ─────────────────────────────────────────────

interface GraphRowProps {
  prefix: string;
  commit: CommitEntry;
  selected: boolean;
  maxWidth: number;
}

function GraphRow({ prefix, commit, selected, maxWidth }: GraphRowProps) {
  const HASH_W = 8; // 7 chars + 1 space
  const metaWidth = 22; // date (10) + gap (2) + author (truncated to 10)
  const msgWidth = Math.max(maxWidth - prefix.length - HASH_W - metaWidth - 2, 10);
  const hash = commit.hash.slice(0, 7).padEnd(7);
  const message = commit.message.slice(0, msgWidth).padEnd(msgWidth);
  const author = commit.author.slice(0, 12).padEnd(12);
  const bg = selected ? 'bgBlue' : undefined;

  return (
    <Box>
      <Text color="yellow" backgroundColor={bg ? 'blue' : undefined}>
        {prefix}
      </Text>
      <Text color="green" backgroundColor={bg ? 'blue' : undefined}>
        {hash}{' '}
      </Text>
      <Text
        bold={selected}
        backgroundColor={bg ? 'blue' : undefined}
        color={selected ? 'white' : undefined}
      >
        {message}
      </Text>
      <Text color="magenta" backgroundColor={bg ? 'blue' : undefined}>
        {' '}
        {author}
      </Text>
      <Text color="gray" backgroundColor={bg ? 'blue' : undefined}>
        {' '}
        {commit.date}
      </Text>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommitScreen({
  repo,
  initialSelectedIdx = 0,
  onBack,
  onOpenDiff,
}: CommitScreenProps) {
  const { stdout } = useStdout();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  const graphLines = buildGraphLines(repo.commits);

  // ── State ────────────────────────────────────────────────────────────
  const [focus, setFocus] = useState<FocusPanel>('graph');
  const [selectedCommitIdx, setSelectedCommitIdx] = useState(
    Math.min(initialSelectedIdx, Math.max(graphLines.length - 1, 0))
  );
  const [graphScroll, setGraphScroll] = useState(0);
  const [infoScroll, setInfoScroll] = useState(0);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [filesScroll, setFilesScroll] = useState(0);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const selectedCommit: CommitEntry = graphLines[selectedCommitIdx]?.commit ?? repo.commits[0]!;

  // Reset bottom-panel scroll when selection changes
  useEffect(() => {
    setInfoScroll(0);
    setFilesScroll(0);
    setSelectedFileIdx(0);
  }, [selectedCommitIdx]);

  // ── Layout dimensions ────────────────────────────────────────────────
  const availableRows = termRows - 4; // header (2) + footer (2)
  const graphHeight = Math.max(Math.floor(availableRows * 0.4), 5);
  const bottomHeight = Math.max(availableRows - graphHeight, 5);
  const halfWidth = Math.floor((termCols - 2) / 2);
  const leftWidth = halfWidth;
  const rightWidth = termCols - halfWidth - 2;

  const graphInnerH = graphHeight - 2;
  const bottomInnerH = bottomHeight - 2;

  // ── Cycle focus ──────────────────────────────────────────────────────
  const cycleTab = useCallback(() => {
    setFocus((prev) => {
      const idx = FOCUS_ORDER.indexOf(prev);
      return FOCUS_ORDER[(idx + 1) % FOCUS_ORDER.length]!;
    });
  }, []);

  // ── Copy SHA ─────────────────────────────────────────────────────────
  const copyHash = useCallback(() => {
    const hash = selectedCommit.hash;
    clipboard.write(hash).then(
      () => {
        setCopyStatus(`Copied ${hash} to clipboard`);
        setTimeout(() => setCopyStatus(null), 1500);
      },
      () => {
        setCopyStatus('Clipboard unavailable — install wl-clipboard');
        setTimeout(() => setCopyStatus(null), 1500);
      }
    );
  }, [selectedCommit.hash]);

  // ── Build file lines (needed before useInput handler) ──────────────────
  const allFileLines = selectedCommit.changedFiles.map((f) => ({ status: f.status, path: f.path }));

  // ── Keyboard input ────────────────────────────────────────────────────
  useInput((input, key) => {
    if (input === 'q') {
      // handled by app, but guard here too
      return;
    }

    if (key.tab) {
      cycleTab();
      return;
    }

    if (input === 'c') {
      copyHash();
      return;
    }

    if (key.backspace || key.delete) {
      onBack();
      return;
    }

    if (key.return && focus === 'files' && onOpenDiff) {
      const selectedFile = allFileLines[selectedFileIdx];
      if (selectedFile) {
        onOpenDiff(selectedCommit, selectedFile);
      }
      return;
    }

    const up = key.upArrow || input === 'k';
    const down = key.downArrow || input === 'j';

    if (focus === 'graph') {
      if (up) setSelectedCommitIdx((p) => Math.max(p - 1, 0));
      if (down) setSelectedCommitIdx((p) => Math.min(p + 1, graphLines.length - 1));
      // Keep the selected row visible
      if (up) setGraphScroll((p) => Math.min(p, Math.max(selectedCommitIdx - 1, 0)));
      if (down)
        setGraphScroll((p) => {
          const next = selectedCommitIdx + 1;
          return next >= p + graphInnerH ? next - graphInnerH + 1 : p;
        });
    } else if (focus === 'files') {
      if (allFileLines.length === 0) return; // Silent no-op when no files
      const maxIdx = allFileLines.length - 1;
      if (up) {
        setSelectedFileIdx((p) => Math.max(p - 1, 0));
        setFilesScroll((p) => Math.min(p, Math.max(selectedFileIdx - 1, 0)));
      }
      if (down) {
        setSelectedFileIdx((p) => Math.min(p + 1, maxIdx));
        setFilesScroll((p) => {
          const next = selectedFileIdx + 1;
          return next >= p + bottomInnerH ? next - bottomInnerH + 1 : p;
        });
      }
    }
  });

  // ── Build info lines ─────────────────────────────────────────────────
  const infoLines: Array<{ label: string; value: string }> = [
    { label: 'Hash  ', value: selectedCommit.hash },
    { label: 'Author', value: selectedCommit.author },
    { label: 'Date  ', value: selectedCommit.date },
    { label: 'Branch', value: selectedCommit.branchName ?? '—' },
  ];
  const bodyLines = selectedCommit.body ? ['', ...selectedCommit.body.split('\n')] : [];

  // ── Visible slices ────────────────────────────────────────────────────
  const visibleGraph = graphLines.slice(graphScroll, graphScroll + graphInnerH);

  const allInfoLines: string[] = [...infoLines.map((l) => `${l.label}  ${l.value}`), ...bodyLines];
  const visibleInfo = allInfoLines.slice(infoScroll, infoScroll + bottomInnerH);

  const visibleFiles = allFileLines.slice(filesScroll, filesScroll + bottomInnerH);

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
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(termCols - 2)}</Text>
      </Box>

      {/* ── Graph panel ──────────────────────────────────────────────── */}
      <Panel
        label="Git Graph"
        focused={focus === 'graph'}
        width={termCols - 2}
        height={graphHeight}
      >
        {visibleGraph.map((line, i) => (
          <GraphRow
            key={line.commit.hash}
            prefix={line.prefix}
            commit={line.commit}
            selected={graphScroll + i === selectedCommitIdx}
            maxWidth={termCols - 4}
          />
        ))}
        {/* Empty rows to fill panel height */}
        {Array.from({ length: Math.max(graphInnerH - visibleGraph.length, 0) }).map((_, i) => (
          <Text key={`empty-graph-${i}`}> </Text>
        ))}
      </Panel>

      {/* ── Bottom panels ────────────────────────────────────────────── */}
      <Box flexDirection="row" gap={1} marginTop={0}>
        {/* Commit info */}
        <Panel label="Commit Info" focused={false} width={leftWidth} height={bottomHeight}>
          {visibleInfo.map((line, i) => {
            const isHeader = i + infoScroll < infoLines.length;
            if (isHeader) {
              const entry = infoLines[i + infoScroll]!;
              return (
                <Box key={`info-${i}`}>
                  <Text color="cyan">{entry.label}</Text>
                  <Text color="gray"> </Text>
                  <Text>{entry.value}</Text>
                </Box>
              );
            }
            return (
              <Box key={`info-body-${i}`}>
                <Text wrap="truncate-end">{line}</Text>
              </Box>
            );
          })}
          {Array.from({ length: Math.max(bottomInnerH - visibleInfo.length, 0) }).map((_, i) => (
            <Text key={`empty-info-${i}`}> </Text>
          ))}
        </Panel>

        {/* Changed files */}
        <Panel
          label="Changed Files"
          focused={focus === 'files'}
          width={rightWidth}
          height={bottomHeight}
        >
          {visibleFiles.map((f, i) => {
            const isSelected = filesScroll + i === selectedFileIdx;
            return (
              <Box key={`file-${i}`}>
                <Text
                  color={isSelected ? undefined : (FILE_STATUS_COLOR[f.status] ?? 'white')}
                  bold={!isSelected}
                  inverse={isSelected}
                >
                  {f.status}
                </Text>
                <Text inverse={isSelected} color={isSelected ? undefined : 'gray'}>
                  {'  '}
                </Text>
                <Text inverse={isSelected} wrap="truncate-end">
                  {f.path}
                </Text>
              </Box>
            );
          })}
          {allFileLines.length === 0 && (
            <Text color="gray" dimColor>
              No changed files
            </Text>
          )}
          {Array.from({
            length: Math.max(
              bottomInnerH - Math.max(visibleFiles.length, allFileLines.length === 0 ? 1 : 0),
              0
            ),
          }).map((_, i) => (
            <Text key={`empty-files-${i}`}> </Text>
          ))}
        </Panel>
      </Box>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <Box marginTop={0}>
        {copyStatus ? (
          <Text color="green" bold>
            {copyStatus}
          </Text>
        ) : (
          <Text color="gray" dimColor>
            [tab] graph/files [j/k] navigate/scroll [enter] view diff [c] copy SHA [bksp] back [q]
            quit
          </Text>
        )}
      </Box>
    </Box>
  );
}
