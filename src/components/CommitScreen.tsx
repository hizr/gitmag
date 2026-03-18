import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Box, Text, useStdout, useInput, useApp } from 'ink';
import clipboard from 'clipboardy';
import type {
  RepoEntry,
  CommitEntry,
  ChangedFile,
  WorkingChanges,
  BranchInfo,
} from '../data/mockRepos.js';
import { buildGraphLines } from '../utils/git-graph.js';
import { FuzzySearchPopup } from './FuzzySearchPopup.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type FocusPanel = 'graph' | 'files';

type FileLine = {
  status: string;
  path: string;
  isHeader?: boolean;
};

const FOCUS_ORDER: FocusPanel[] = ['graph', 'files'];

const FILE_STATUS_COLOR: Record<string, string> = {
  A: 'green',
  M: 'yellow',
  D: 'red',
  R: 'cyan',
};

interface CommitScreenProps {
  repo: RepoEntry;
  initialSelectedCommitIdx?: number;
  initialSelectedFileIdx?: number;
  onBack: () => void;
  onOpenDiff?: (commit: CommitEntry, file: ChangedFile, fileIdx: number, commitIdx: number) => void;
  workingChanges?: WorkingChanges | null;
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
        <Text color={borderColor}> </Text>
        <Box flexDirection="column" width={innerWidth} overflow="hidden">
          {children}
        </Box>
        <Text color={borderColor}> </Text>
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
  isMatchedResult?: boolean;
  isActiveMatch?: boolean;
}

function GraphRow({
  prefix,
  commit,
  selected,
  maxWidth,
  isMatchedResult,
  isActiveMatch,
}: GraphRowProps) {
  const HASH_W = 8; // 7 chars + 1 space
  const metaWidth = 22; // date (10) + gap (2) + author (truncated to 10)

  // Render ref badges
  const refBadges = commit.refs.map((ref) => `[${ref}]`);

  const badgeText = refBadges.length > 0 ? ' ' + refBadges.join(' ') : '';
  const badgeWidth = badgeText.length;
  const msgWidth = Math.max(maxWidth - prefix.length - HASH_W - metaWidth - badgeWidth - 2, 10);

  // Use diamond symbol for WORKING node
  const isWorking = commit.hash === '__WORKING__';
  const displayHash = isWorking ? 'WORK' : commit.hash.slice(0, 7);
  const hash = displayHash.padEnd(7);
  const message = commit.message.slice(0, msgWidth).padEnd(msgWidth);
  const author = commit.author.slice(0, 12).padEnd(12);
  const bg = selected ? 'bgBlue' : isActiveMatch ? 'bgGreen' : undefined;
  const matchMarker = isMatchedResult ? (isActiveMatch ? '●' : '○') : ' ';

  // Override prefix for WORKING node to show diamond
  const displayPrefix = isWorking ? prefix.replace('●', '◆') : prefix;

  return (
    <Box>
      <Text
        color={isMatchedResult ? 'yellow' : isWorking ? 'yellow' : 'yellow'}
        backgroundColor={bg ? (bg === 'bgGreen' ? 'green' : 'blue') : undefined}
      >
        {displayPrefix}
      </Text>
      <Text
        color={isMatchedResult ? 'yellow' : isWorking ? 'yellow' : 'green'}
        backgroundColor={bg ? (bg === 'bgGreen' ? 'green' : 'blue') : undefined}
      >
        {matchMarker}
        {hash}{' '}
      </Text>
      <Text
        bold={selected}
        backgroundColor={bg ? (bg === 'bgGreen' ? 'green' : 'blue') : undefined}
        color={selected ? 'white' : undefined}
      >
        {message}
      </Text>
      {/* Render ref badges with color-coding */}
      {commit.refs.map((ref, idx) => {
        let color: string;
        if (ref === 'HEAD') {
          color = 'cyan';
        } else if (ref.startsWith('origin/')) {
          color = 'yellow';
        } else if (ref.startsWith('refs/tags/') || /^v?\d+\.\d+/.test(ref)) {
          color = 'magenta';
        } else {
          color = 'green';
        }
        return (
          <Text
            key={idx}
            color={color}
            bold={ref === 'HEAD'}
            backgroundColor={bg ? (bg === 'bgGreen' ? 'green' : 'blue') : undefined}
          >
            {' ['}
            {ref}
            {']'}
          </Text>
        );
      })}
      <Text
        color="magenta"
        backgroundColor={bg ? (bg === 'bgGreen' ? 'green' : 'blue') : undefined}
      >
        {' '}
        {author}
      </Text>
      <Text color="gray" backgroundColor={bg ? (bg === 'bgGreen' ? 'green' : 'blue') : undefined}>
        {' '}
        {commit.date}
      </Text>
    </Box>
  );
}

// ── Branch info panel ─────────────────────────────────────────────────────────

interface BranchInfoPanelProps {
  branchInfo: BranchInfo | undefined;
  width: number;
}

function BranchInfoPanel({ branchInfo, width }: BranchInfoPanelProps) {
  if (!branchInfo) {
    return (
      <Panel label="Branch Info" focused={false} width={width} height={5}>
        <Text color="gray" dimColor>
          Loading branch information…
        </Text>
      </Panel>
    );
  }

  const halfWidth = Math.floor((width - 6) / 2); // Account for borders and gap
  const leftColWidth = halfWidth;
  const rightColWidth = width - halfWidth - 6;

  // Format ahead/behind display
  const aheadBehindStr =
    branchInfo.remoteBranch && (branchInfo.ahead > 0 || branchInfo.behind > 0)
      ? `↑${branchInfo.ahead} ↓${branchInfo.behind}`
      : branchInfo.remoteBranch
        ? '✓'
        : '—';

  // Format remote tracking display
  const statusStr = branchInfo.remoteBranch
    ? `${branchInfo.remoteBranch}  ${aheadBehindStr}`
    : '(no upstream)';

  return (
    <Panel label="Branch Info" focused={false} width={width} height={5}>
      <Box flexDirection="column">
        <Box marginBottom={0}>
          <Box width={leftColWidth}>
            <Text color="cyan">Branch</Text>
            <Text> </Text>
            <Text bold>{branchInfo.currentBranch}</Text>
          </Box>
          <Box width={rightColWidth}>
            <Text color="cyan">Path</Text>
            <Text> </Text>
            <Text>{branchInfo.repoPath}</Text>
          </Box>
        </Box>

        <Box marginBottom={0}>
          <Box width={leftColWidth}>
            <Text color="cyan">Remote</Text>
            <Text> </Text>
            <Text>{statusStr}</Text>
          </Box>
          <Box width={rightColWidth}>
            <Text color="cyan">Head</Text>
            <Text> </Text>
            <Text>{branchInfo.headAuthor}</Text>
          </Box>
        </Box>
      </Box>
    </Panel>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommitScreen({
  repo,
  initialSelectedCommitIdx = 0,
  initialSelectedFileIdx = 0,
  onBack,
  onOpenDiff,
  workingChanges,
}: CommitScreenProps) {
  const { stdout } = useStdout();
  const { exit } = useApp();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  // ── Create synthetic WORKING node if there are changes ─────────────────
  const hasChanges =
    workingChanges &&
    (workingChanges.staged.length > 0 ||
      workingChanges.unstaged.length > 0 ||
      workingChanges.untracked.length > 0);

  const syntheticWorkingCommit: CommitEntry | null = hasChanges
    ? {
        hash: '__WORKING__',
        message: '[WORKING] Local changes',
        date: new Date().toISOString().split('T')[0],
        author: 'you',
        body: '',
        parentHash: repo.commits.length > 0 ? [repo.commits[0].hash] : [],
        refs: [],
        changedFiles: [
          ...workingChanges.staged,
          ...workingChanges.unstaged,
          ...workingChanges.untracked,
        ],
      }
    : null;

  // Prepend WORKING node if it exists
  const commitsWithWorking = syntheticWorkingCommit
    ? [syntheticWorkingCommit, ...repo.commits]
    : repo.commits;

  const graphLines = buildGraphLines(commitsWithWorking);

  // ── State ────────────────────────────────────────────────────────
  const [focus, setFocus] = useState<FocusPanel>('graph');
  const [selectedCommitIdx, setSelectedCommitIdx] = useState(
    Math.min(initialSelectedCommitIdx, Math.max(graphLines.length - 1, 0))
  );
  const [graphScroll, setGraphScroll] = useState(0);
  const [infoScroll, setInfoScroll] = useState(0);
  const [selectedFileIdx, setSelectedFileIdx] = useState(initialSelectedFileIdx);
  const [filesScroll, setFilesScroll] = useState(0);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(-1);

  const selectedCommit: CommitEntry = graphLines[selectedCommitIdx]?.commit ?? repo.commits[0]!;

  // Reset bottom-panel scroll when selection changes, but preserve file selection
  // when returning from diff view (indicated by initialSelectedFileIdx > 0)
  useEffect(() => {
    setInfoScroll(0);
    setFilesScroll(0);
    // Only reset file selection if we're not returning from a diff view
    if (initialSelectedFileIdx === 0) {
      setSelectedFileIdx(0);
    }
  }, [selectedCommitIdx, initialSelectedFileIdx]);

  // Restore focus to 'files' when returning from diff view
  useEffect(() => {
    if (initialSelectedFileIdx && initialSelectedFileIdx > 0) {
      setFocus('files');
    }
  }, [initialSelectedFileIdx]);

  // ── Layout dimensions ────────────────────────────────────────────────
  const availableRows = termRows - 4; // header (2) + footer (2)
  const branchPanelHeight = 5; // Fixed height for branch info
  const remainingRows = Math.max(availableRows - branchPanelHeight - 1, 10); // After branch panel + gap
  const graphHeight = Math.max(Math.floor(remainingRows * 0.4), 5);
  const bottomHeight = Math.max(remainingRows - graphHeight, 5);
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
  const allFileLines: FileLine[] = [];

  if (selectedCommit.hash === '__WORKING__') {
    // For WORKING node, group files by category
    const staged = selectedCommit.changedFiles.filter(
      (f) => f.status !== 'M' && f.status !== 'D' && f.status !== '??'
    );
    const unstaged = selectedCommit.changedFiles.filter(
      (f) => f.status === 'M' || f.status === 'D'
    );
    const untracked = selectedCommit.changedFiles.filter((f) => f.status === '??');

    if (staged.length > 0) {
      allFileLines.push({ status: '📦', path: 'Staged', isHeader: true });
      allFileLines.push(...staged.map((f) => ({ status: f.status, path: f.path })));
    }
    if (unstaged.length > 0) {
      allFileLines.push({ status: '✎', path: 'Unstaged', isHeader: true });
      allFileLines.push(...unstaged.map((f) => ({ status: f.status, path: f.path })));
    }
    if (untracked.length > 0) {
      allFileLines.push({ status: '?', path: 'Untracked', isHeader: true });
      allFileLines.push(...untracked.map((f) => ({ status: f.status, path: f.path })));
    }
  } else {
    // Normal commit: flat list of files
    allFileLines.push(
      ...selectedCommit.changedFiles.map((f) => ({ status: f.status, path: f.path }))
    );
  }

  // ── Keyboard input ────────────────────────────────────────────────────
  useInput((input, key) => {
    if (input === 'q') {
      exit();
      return;
    }

    // Handle search-specific keys when search is open
    if (searchOpen) {
      if (input === '/') {
        // Clear and restart search
        setSearchOpen(true);
        return;
      }
      if (key.escape) {
        setSearchOpen(false);
        return;
      }
      // Let FuzzySearchPopup handle other input via its own useInput
      return;
    }

    // Handle n/m navigation when matches exist
    if (input === 'n' && matchIndices.length > 0) {
      const nextIdx = (activeMatchIdx + 1) % matchIndices.length;
      setActiveMatchIdx(nextIdx);
      const newCommitIdx = matchIndices[nextIdx]!;
      setSelectedCommitIdx(newCommitIdx);
      // Adjust scroll
      setGraphScroll((p) => {
        const next = newCommitIdx;
        return next >= p + graphInnerH ? next - graphInnerH + 1 : next < p ? next : p;
      });
      return;
    }

    if (input === 'm' && matchIndices.length > 0) {
      const nextIdx =
        activeMatchIdx === -1
          ? matchIndices.length - 1
          : (activeMatchIdx - 1 + matchIndices.length) % matchIndices.length;
      setActiveMatchIdx(nextIdx);
      const newCommitIdx = matchIndices[nextIdx]!;
      setSelectedCommitIdx(newCommitIdx);
      // Adjust scroll
      setGraphScroll((p) => {
        const next = newCommitIdx;
        return next >= p + graphInnerH ? next - graphInnerH + 1 : next < p ? next : p;
      });
      return;
    }

    // Clear matches when pressing escape
    if (key.escape && matchIndices.length > 0) {
      setMatchIndices([]);
      setActiveMatchIdx(-1);
      return;
    }

    // Open search on /
    if (input === '/') {
      setSearchOpen(true);
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
      if (focus === 'files') {
        setFocus('graph');
      } else {
        onBack();
      }
      return;
    }

    if (key.return && focus === 'graph') {
      setFocus('files');
      return;
    }

    if (key.return && focus === 'files' && onOpenDiff) {
      const selectedFile = allFileLines[selectedFileIdx];
      if (selectedFile && !selectedFile.isHeader) {
        // Convert FileLine back to ChangedFile format
        onOpenDiff(
          selectedCommit,
          {
            status: selectedFile.status as any,
            path: selectedFile.path,
          },
          selectedFileIdx,
          selectedCommitIdx
        );
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
  let infoLines: Array<{ label: string; value: string }>;
  let bodyLines: string[];

  if (selectedCommit.hash === '__WORKING__') {
    // For WORKING node, show status summary instead of commit metadata
    const staged = selectedCommit.changedFiles.filter(
      (f) => f.status !== 'M' && f.status !== 'D' && f.status !== '??'
    );
    const unstaged = selectedCommit.changedFiles.filter(
      (f) => f.status === 'M' || f.status === 'D'
    );
    const untracked = selectedCommit.changedFiles.filter((f) => f.status === '??');

    infoLines = [
      { label: 'Status ', value: 'Working directory changes' },
      { label: 'Staged ', value: `${staged.length} file(s)` },
      { label: 'Unstaged', value: `${unstaged.length} file(s)` },
      { label: 'Untracked', value: `${untracked.length} file(s)` },
    ];
    bodyLines = [];
  } else {
    infoLines = [
      { label: 'Hash  ', value: selectedCommit.hash },
      { label: 'Author', value: selectedCommit.author },
      { label: 'Date  ', value: selectedCommit.date },
      {
        label: 'Refs  ',
        value: selectedCommit.refs.length > 0 ? selectedCommit.refs.join(', ') : '—',
      },
    ];
    bodyLines = selectedCommit.body ? ['', ...selectedCommit.body.split('\n')] : [];
  }

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

      {/* ── Branch info panel ────────────────────────────────────────── */}
      <Box marginBottom={1}>
        <BranchInfoPanel branchInfo={repo.branchInfo} width={termCols - 2} />
      </Box>

      {/* ── Graph panel ──────────────────────────────────────────────── */}
      {searchOpen ? (
        <Box marginTop={0}>
          <FuzzySearchPopup
            commits={commitsWithWorking}
            onSelect={(commitIdx) => {
              setSelectedCommitIdx(commitIdx);
              setSearchOpen(false);
              // Store the matched indices for n/m navigation
              // For now, we'll populate matches on next search
              setMatchIndices([commitIdx]);
              setActiveMatchIdx(0);
              // Adjust scroll to show selected commit
              setGraphScroll((p) => {
                const next = commitIdx;
                return next >= p + graphInnerH ? next - graphInnerH + 1 : next < p ? next : p;
              });
            }}
            onClose={() => setSearchOpen(false)}
            maxWidth={termCols - 2}
            maxHeight={graphHeight}
          />
        </Box>
      ) : (
        <Panel
          label="Git Graph"
          focused={focus === 'graph'}
          width={termCols - 2}
          height={graphHeight}
        >
          {visibleGraph.map((line, i) => {
            const globalIdx = graphScroll + i;
            const isMatchedResult = matchIndices.includes(globalIdx);
            const isActiveMatch =
              globalIdx === (activeMatchIdx >= 0 ? matchIndices[activeMatchIdx] : -1);
            return (
              <GraphRow
                key={line.commit.hash}
                prefix={line.prefix}
                commit={line.commit}
                selected={globalIdx === selectedCommitIdx}
                maxWidth={termCols - 4}
                isMatchedResult={isMatchedResult}
                isActiveMatch={isActiveMatch}
              />
            );
          })}
          {/* Empty rows to fill panel height */}
          {Array.from({ length: Math.max(graphInnerH - visibleGraph.length, 0) }).map((_, i) => (
            <Text key={`empty-graph-${i}`}> </Text>
          ))}
        </Panel>
      )}

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
            if (f.isHeader) {
              // Header row for file category
              return (
                <Box key={`file-header-${i}`}>
                  <Text bold color="cyan">
                    {f.status} {f.path}
                  </Text>
                </Box>
              );
            }
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
        ) : matchIndices.length > 0 ? (
          <Text color="gray" dimColor>
            [n/m] next/prev match ({matchIndices.length} results) [/] new search [ESC] clear [j/k]
            navigate [q] quit
          </Text>
        ) : (
          <Text color="gray" dimColor>
            [/] search [j/k] navigate [enter] select/diff [c] copy SHA [bksp] back [q] quit
          </Text>
        )}
      </Box>
    </Box>
  );
}
