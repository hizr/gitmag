import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Box, Text, useStdout, useInput, useApp, type Key } from 'ink';
import type { RepoEntry, CommitEntry, ChangedFile, WorkingChanges } from '../data/mockRepos.js';
import { buildGraphLines, isRenderableConnectorPrefix } from '../utils/git-graph.js';
import { FuzzySearchPopup } from './FuzzySearchPopup.js';
import { Panel } from './common/Panel.js';
import { GraphRow, GraphConnectorRow } from './commit-screen/GraphRow.js';
import { BranchInfoPanel } from './commit-screen/BranchInfoPanel.js';
import { CommitInfoPanel } from './commit-screen/CommitInfoPanel.js';
import { ChangedFilesPanel } from './commit-screen/ChangedFilesPanel.js';
import {
  handleClipboardSuccess,
  handleClipboardError,
  handleModuleError,
  buildFileLines,
  buildInfoLines,
  type FileLine,
} from './commit-screen/commit-screen.utils.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type FocusPanel = 'graph' | 'files';

const FOCUS_ORDER: FocusPanel[] = ['graph', 'files'];

interface CommitScreenProps {
  readonly repo: RepoEntry;
  readonly initialSelectedCommitIdx?: number;
  readonly initialSelectedFileIdx?: number;
  readonly onBack: () => void;
  readonly onOpenDiff?: (
    commit: CommitEntry,
    file: ChangedFile,
    fileIdx: number,
    commitIdx: number
  ) => void;
  readonly workingChanges?: WorkingChanges | null;
  readonly onPickCommit?: (hash: string) => void;
}

export function CommitScreen({
  repo,
  initialSelectedCommitIdx = 0,
  initialSelectedFileIdx = 0,
  onBack,
  onOpenDiff,
  workingChanges,
  onPickCommit,
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

  // Build a mapping from "commit index" (index into commits only, skipping connectors)
  // to "graph line index" (index into all graphLines including connectors)
  const commitOnlyIndices = graphLines
    .map((line, i) => (line.kind === 'commit' ? i : -1))
    .filter((i) => i !== -1);

  // ── State ────────────────────────────────────────────────────────
  const [focus, setFocus] = useState<FocusPanel>('graph');
  const [selectedCommitIdx, setSelectedCommitIdx] = useState(
    Math.min(initialSelectedCommitIdx, Math.max(commitOnlyIndices.length - 1, 0))
  );
  const selectedCommitIdxRef = useRef(selectedCommitIdx);

  // Keep the ref in sync whenever selectedCommitIdx changes (from any setter)
  useEffect(() => {
    selectedCommitIdxRef.current = selectedCommitIdx;
  }, [selectedCommitIdx]);
  const [graphScroll, setGraphScroll] = useState(0);
  const [infoScroll, setInfoScroll] = useState(0);
  const [selectedFileIdx, setSelectedFileIdx] = useState(initialSelectedFileIdx);
  const [filesScroll, setFilesScroll] = useState(0);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [matchIndices, setMatchIndices] = useState<number[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(-1);
  const [previewCommitIdx, setPreviewCommitIdx] = useState<number | null>(null);

  // Helper to get commit from a commit index (not graphLine index)
  const getCommitAtIdx = (commitIdx: number): CommitEntry => {
    const graphLineIdx = commitOnlyIndices[commitIdx];
    if (graphLineIdx != null) {
      const line = graphLines[graphLineIdx];
      if (line && line.kind === 'commit') {
        return line.commit;
      }
    }
    return repo.commits[0]!;
  };

  const selectedCommit: CommitEntry = getCommitAtIdx(selectedCommitIdx);

  // Use preview commit if search is active and user is browsing results, otherwise use selected commit
  const displayCommitIdx = previewCommitIdx ?? selectedCommitIdx;
  const displayCommit: CommitEntry = getCommitAtIdx(displayCommitIdx);

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
  const graphInnerW = Math.max(termCols - 5, 1);
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
    // Dynamically import clipboardy only when needed (deferred to first use)
    import('clipboardy').then(
      ({ default: clipboard }) => {
        clipboard.write(hash).then(
          () => {
            handleClipboardSuccess(hash, setCopyStatus);
          },
          () => {
            handleClipboardError(setCopyStatus);
          }
        );
      },
      () => {
        handleModuleError(setCopyStatus);
      }
    );
  }, [selectedCommit.hash]);

  // ── Navigate to next/prev search match ───────────────────────────────
  const navigateMatch = useCallback(
    (direction: 'next' | 'prev') => {
      if (matchIndices.length === 0) return;
      let nextIdx: number;
      if (direction === 'next') {
        nextIdx = (activeMatchIdx + 1) % matchIndices.length;
      } else if (activeMatchIdx === -1) {
        nextIdx = matchIndices.length - 1;
      } else {
        nextIdx = (activeMatchIdx - 1 + matchIndices.length) % matchIndices.length;
      }
      setActiveMatchIdx(nextIdx);
      const newCommitIdx = matchIndices[nextIdx]!;
      selectedCommitIdxRef.current = newCommitIdx;
      setSelectedCommitIdx(newCommitIdx);
      const newGraphLineIdx = commitOnlyIndices[newCommitIdx] ?? 0;
      setGraphScroll((p) => {
        if (newGraphLineIdx < p) return newGraphLineIdx;
        if (newGraphLineIdx >= p + graphInnerH) return newGraphLineIdx - graphInnerH + 1;
        return p;
      });
    },
    [matchIndices, activeMatchIdx, graphInnerH]
  );

  // ── Navigate graph rows ───────────────────────────────────────────────
  const navigateGraph = useCallback(
    (direction: 'up' | 'down') => {
      const currentIdx = selectedCommitIdxRef.current;
      const nextCommitIdx =
        direction === 'up'
          ? Math.max(currentIdx - 1, 0)
          : Math.min(currentIdx + 1, commitOnlyIndices.length - 1);

      selectedCommitIdxRef.current = nextCommitIdx;
      setSelectedCommitIdx(nextCommitIdx);

      // Scroll operates in graphLines space; convert commit index → graphLine index
      const nextGraphLineIdx = commitOnlyIndices[nextCommitIdx] ?? 0;
      const maxScroll = Math.max(graphLines.length - graphInnerH, 0);
      // Keep a scroll margin so connector rows around the selection stay visible.
      // This prevents multi-line jumps when a connector sits between two commits.
      const scrollMargin = graphInnerH > 3 ? 1 : 0;

      setGraphScroll((p) => {
        // Scrolling up: keep margin rows above selection visible
        if (nextGraphLineIdx < p + scrollMargin) {
          return Math.max(nextGraphLineIdx - scrollMargin, 0);
        }
        // Scrolling down: keep margin rows below selection visible
        if (nextGraphLineIdx > p + graphInnerH - 1 - scrollMargin) {
          return Math.min(nextGraphLineIdx - graphInnerH + 1 + scrollMargin, maxScroll);
        }
        return p;
      });
    },
    [commitOnlyIndices, graphInnerH, graphLines.length]
  );

  // ── Navigate file list ────────────────────────────────────────────────
  const navigateFiles = useCallback(
    (direction: 'up' | 'down', fileLines: FileLine[]) => {
      if (fileLines.length === 0) return;
      const maxIdx = fileLines.length - 1;
      if (direction === 'up') {
        setSelectedFileIdx((p) => Math.max(p - 1, 0));
        setFilesScroll((p) => Math.min(p, Math.max(selectedFileIdx - 1, 0)));
      } else {
        setSelectedFileIdx((p) => Math.min(p + 1, maxIdx));
        setFilesScroll((p) => {
          const next = selectedFileIdx + 1;
          return next >= p + bottomInnerH ? next - bottomInnerH + 1 : p;
        });
      }
    },
    [selectedFileIdx, bottomInnerH]
  );

  // ── Build file lines (needed before useInput handler) ──────────────────
  const allFileLines = buildFileLines(displayCommit);

  // ── Keyboard sub-handlers ─────────────────────────────────────────────
  const handleOpenDiff = useCallback(
    (fileLines: FileLine[]) => {
      if (!onOpenDiff) return;
      const selectedFile = fileLines[selectedFileIdx];
      if (selectedFile && !selectedFile.isHeader) {
        onOpenDiff(
          selectedCommit,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { status: selectedFile.status as any, path: selectedFile.path },
          selectedFileIdx,
          selectedCommitIdx
        );
      }
    },
    [onOpenDiff, selectedCommit, selectedFileIdx, selectedCommitIdx]
  );

  const handleBackOrDelete = useCallback(() => {
    if (focus === 'files') {
      setFocus('graph');
    } else {
      onBack();
    }
  }, [focus, onBack]);

  const handleReturn = useCallback(
    (fileLines: FileLine[]) => {
      if (focus === 'graph') {
        setFocus('files');
      } else if (focus === 'files') {
        handleOpenDiff(fileLines);
      }
    },
    [focus, handleOpenDiff]
  );

  const handleArrowInput = useCallback(
    (_input: string, key: Key, fileLines: FileLine[]) => {
      const up = key.upArrow;
      const down = key.downArrow;
      if (!up && !down) return;
      if (focus === 'graph') {
        navigateGraph(up ? 'up' : 'down');
      } else if (focus === 'files') {
        navigateFiles(up ? 'up' : 'down', fileLines);
      }
    },
    [focus, navigateGraph, navigateFiles]
  );

  // ── Keyboard input ────────────────────────────────────────────────────
  useInput((input, key) => {
    if (searchOpen) return;
    if (input === 'q') {
      exit();
      return;
    }
    if (input === 'p') {
      onPickCommit?.(selectedCommit.hash);
      exit();
      return;
    }
    if (input === 'n') {
      navigateMatch('next');
      return;
    }
    if (input === 'm') {
      navigateMatch('prev');
      return;
    }
    if (key.escape && matchIndices.length > 0) {
      setMatchIndices([]);
      setActiveMatchIdx(-1);
      return;
    }
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
      handleBackOrDelete();
      return;
    }
    if (key.return) {
      handleReturn(allFileLines);
      return;
    }
    handleArrowInput(input, key, allFileLines);
  });

  // ── Build info lines ─────────────────────────────────────────────────
  buildInfoLines(displayCommit); // Used by CommitInfoPanel

  // ── Visible slices ────────────────────────────────────────────────────
  const visibleGraph = graphLines.slice(graphScroll, graphScroll + graphInnerH);

  // ── Footer node ────────────────────────────────────────────────────────
  let footerNode: ReactNode;
  if (copyStatus) {
    footerNode = (
      <Text color="green" bold>
        {copyStatus}
      </Text>
    );
  } else if (matchIndices.length > 0) {
    footerNode = (
      <Text color="gray" dimColor>
        [n/m] next/prev match ({matchIndices.length} results) [/] new search [ESC] clear [up/down]
        navigate [q] quit
      </Text>
    );
  } else {
    footerNode = (
      <Text color="gray" dimColor>
        [/] search [up/down] navigate [enter] select/diff [c] copy SHA [p] pick [bksp/del] back [q]
        quit
      </Text>
    );
  }
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
        <BranchInfoPanel branchInfo={repo.branchInfo} width={termCols - 1} />
      </Box>

      {/* ── Graph panel ──────────────────────────────────────────────── */}
      {searchOpen ? (
        <Box marginTop={0}>
          <FuzzySearchPopup
            commits={commitsWithWorking}
            onSelect={(commitIdx) => {
              setSelectedCommitIdx(commitIdx);
              setSearchOpen(false);
              setMatchIndices([commitIdx]);
              setActiveMatchIdx(0);
              const graphLineIdx = commitOnlyIndices[commitIdx] ?? 0;
              setGraphScroll((p) => {
                if (graphLineIdx < p) return graphLineIdx;
                if (graphLineIdx >= p + graphInnerH) return graphLineIdx - graphInnerH + 1;
                return p;
              });
            }}
            onHighlight={(commitIdx) => {
              setPreviewCommitIdx(commitIdx);
            }}
            onClose={() => setSearchOpen(false)}
            maxWidth={termCols - 1}
            maxHeight={graphHeight}
          />
        </Box>
      ) : (
        <Panel
          label="Git Graph"
          focused={focus === 'graph'}
          width={termCols - 1}
          height={graphHeight}
        >
          {visibleGraph.map((line, i) => {
            const globalIdx = graphScroll + i;

            // Handle connector rows (no commit, just prefix)
            if (line.kind === 'connector') {
              if (!isRenderableConnectorPrefix(line.prefix)) {
                return null;
              }
              return (
                <GraphConnectorRow
                  key={`connector-${globalIdx}`}
                  prefix={line.prefix}
                  maxWidth={graphInnerW}
                />
              );
            }

            // Handle commit rows
            const commit = line.commit;
            // matchIndices stores commit indices; convert to graphLine indices for comparison
            const isMatchedResult = matchIndices.some(
              (commitIdx) => commitOnlyIndices[commitIdx] === globalIdx
            );
            const activeMatchCommitIdx =
              activeMatchIdx >= 0 ? (matchIndices[activeMatchIdx] ?? -1) : -1;
            const activeMatchGraphIdx =
              activeMatchCommitIdx >= 0 ? (commitOnlyIndices[activeMatchCommitIdx] ?? -1) : -1;
            const isActiveMatch = globalIdx === activeMatchGraphIdx;

            // Check if this commit row is selected
            // selectedCommitIdx is an index into commitOnlyIndices
            const graphLineIdxOfSelection = commitOnlyIndices[selectedCommitIdx];
            const isSelected = globalIdx === graphLineIdxOfSelection;

            return (
              <GraphRow
                key={commit.hash}
                prefix={line.prefix}
                commit={commit}
                selected={isSelected}
                maxWidth={graphInnerW}
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
        <CommitInfoPanel
          commit={displayCommit}
          width={leftWidth}
          height={bottomHeight}
          infoScroll={infoScroll}
          innerHeight={bottomInnerH}
        />

        {/* Changed files */}
        <ChangedFilesPanel
          fileLines={allFileLines}
          selectedFileIdx={selectedFileIdx}
          filesScroll={filesScroll}
          width={rightWidth}
          height={bottomHeight}
          innerHeight={bottomInnerH}
          focused={focus === 'files'}
        />
      </Box>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <Box marginTop={0}>{footerNode}</Box>
    </Box>
  );
}
