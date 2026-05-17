import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Text, useStdout, useInput, useApp, type Key } from 'ink';
import type { RepoEntry, CommitEntry, ChangedFile, WorkingChanges } from '../data/mockRepos.js';
import { buildGraphLines, isRenderableConnectorPrefix } from '../utils/git-graph.js';
import { FuzzySearchPopup } from './FuzzySearchPopup.js';
import { Panel } from './common/Panel.js';
import { GraphRow, GraphConnectorRow } from './commit-screen/GraphRow.js';
import { BranchInfoPanel } from './commit-screen/BranchInfoPanel.js';
import { CommitInfoPanel } from './commit-screen/CommitInfoPanel.js';
import { ChangedFilesPanel } from './commit-screen/ChangedFilesPanel.js';
import { FooterNode } from './commit-screen/FooterNode.js';
import type { Repository } from '../data/Repository.js';
import { DEFAULT_KEYMAP } from '../keymap/default-keymap.js';
import { isActionPressed } from '../keymap/match.js';
import { KEY_ACTION, type AppKeymap } from '../keymap/types.js';
import {
  handleClipboardSuccess,
  handleClipboardError,
  handleModuleError,
  buildFileLines,
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
  readonly repository?: Repository | null;
  readonly refreshWorkingChanges?: () => Promise<WorkingChanges | null>;
  readonly keymap?: AppKeymap;
}

export function CommitScreen({
  repo,
  initialSelectedCommitIdx = 0,
  initialSelectedFileIdx = 0,
  onBack,
  onOpenDiff,
  workingChanges,
  onPickCommit,
  repository,
  refreshWorkingChanges,
  keymap = DEFAULT_KEYMAP,
}: CommitScreenProps) {
  const { stdout } = useStdout();
  const { exit } = useApp();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  // ── Create synthetic WORKING node if there are changes ─────────────────
  const syntheticWorkingCommit = useMemo<CommitEntry | null>(() => {
    const hasChanges =
      workingChanges &&
      (workingChanges.staged.length > 0 ||
        workingChanges.unstaged.length > 0 ||
        workingChanges.untracked.length > 0);
    if (!hasChanges) return null;
    return {
      hash: '__WORKING__',
      message: '[WORKING] Local changes',
      date: new Date().toISOString().split('T')[0],
      author: 'you',
      body: '',
      parentHash: repo.commits.length > 0 ? [repo.commits[0]!.hash] : [],
      refs: [],
      changedFiles: [
        ...workingChanges!.staged,
        ...workingChanges!.unstaged,
        ...workingChanges!.untracked,
      ],
    };
  }, [workingChanges, repo.commits]);

  // Prepend WORKING node if it exists
  const commitsWithWorking = useMemo(
    () => (syntheticWorkingCommit ? [syntheticWorkingCommit, ...repo.commits] : repo.commits),
    [syntheticWorkingCommit, repo.commits]
  );

  const graphLines = useMemo(() => buildGraphLines(commitsWithWorking), [commitsWithWorking]);

  // Build a mapping from "commit index" (index into commits only, skipping connectors)
  // to "graph line index" (index into all graphLines including connectors)
  const commitOnlyIndices = useMemo(
    () => graphLines.map((line, i) => (line.kind === 'commit' ? i : -1)).filter((i) => i !== -1),
    [graphLines]
  );

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
  const getCommitAtIdx = useCallback(
    (commitIdx: number): CommitEntry => {
      const graphLineIdx = commitOnlyIndices[commitIdx];
      if (graphLineIdx != null) {
        const line = graphLines[graphLineIdx];
        if (line && line.kind === 'commit') {
          return line.commit;
        }
      }
      return repo.commits[0]!;
    },
    [commitOnlyIndices, graphLines, repo.commits]
  );

  const selectedCommit = useMemo(
    () => getCommitAtIdx(selectedCommitIdx),
    [getCommitAtIdx, selectedCommitIdx]
  );

  // Use preview commit if search is active and user is browsing results, otherwise use selected commit
  const displayCommitIdx = previewCommitIdx ?? selectedCommitIdx;
  const displayCommit = useMemo(
    () => getCommitAtIdx(displayCommitIdx),
    [getCommitAtIdx, displayCommitIdx]
  );

  // Reset bottom-panel scroll when selection changes.
  // Inlined directly into navigation handlers to avoid a follow-up render.
  // (Preserved as a helper function so all three call-sites share one path.)
  const resetBottomPanels = useCallback(() => {
    setInfoScroll(0);
    setFilesScroll(0);
    if (initialSelectedFileIdx === 0) {
      setSelectedFileIdx(0);
    }
  }, [initialSelectedFileIdx]);

  // Restore focus to 'files' when returning from diff view
  useEffect(() => {
    if (initialSelectedFileIdx && initialSelectedFileIdx > 0) {
      setFocus('files');
    }
  }, [initialSelectedFileIdx]);

  // ── Layout dimensions ────────────────────────────────────────────────
  const {
    graphHeight,
    bottomHeight,
    leftWidth,
    rightWidth,
    graphInnerH,
    graphInnerW,
    bottomInnerH,
  } = useMemo(() => {
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
    return {
      graphHeight,
      bottomHeight,
      leftWidth,
      rightWidth,
      graphInnerH,
      graphInnerW,
      bottomInnerH,
    };
  }, [termCols, termRows]);

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
      resetBottomPanels();
      const newGraphLineIdx = commitOnlyIndices[newCommitIdx] ?? 0;
      setGraphScroll((p) => {
        if (newGraphLineIdx < p) return newGraphLineIdx;
        if (newGraphLineIdx >= p + graphInnerH) return newGraphLineIdx - graphInnerH + 1;
        return p;
      });
    },
    [matchIndices, activeMatchIdx, graphInnerH, resetBottomPanels]
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
      resetBottomPanels();

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
    [commitOnlyIndices, graphInnerH, graphLines.length, resetBottomPanels]
  );

  // ── Navigate file list ────────────────────────────────────────────────
  const navigateFiles = useCallback(
    (direction: 'up' | 'down', fileLines: FileLine[]) => {
      if (fileLines.length === 0) return;
      const maxIdx = fileLines.length - 1;
      setSelectedFileIdx((currentIdx) => {
        let nextIdx = currentIdx;

        while (true) {
          const candidateIdx =
            direction === 'up' ? Math.max(nextIdx - 1, 0) : Math.min(nextIdx + 1, maxIdx);

          if (candidateIdx === nextIdx) {
            break;
          }

          nextIdx = candidateIdx;
          if (!fileLines[nextIdx]?.isHeader) {
            break;
          }
        }

        setFilesScroll((scrollPos) => {
          if (nextIdx < scrollPos) return nextIdx;
          if (nextIdx >= scrollPos + bottomInnerH) return nextIdx - bottomInnerH + 1;
          return scrollPos;
        });

        return nextIdx;
      });
    },
    [bottomInnerH]
  );

  // ── Build file lines (needed before useInput handler) ──────────────────
  const allFileLines = useMemo(
    () => buildFileLines(displayCommit, workingChanges || undefined),
    [displayCommit, workingChanges]
  );

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
    (input: string, key: Key, fileLines: FileLine[]) => {
      const up = isActionPressed(keymap, KEY_ACTION.navigationUp, input, key);
      const down = isActionPressed(keymap, KEY_ACTION.navigationDown, input, key);
      if (!up && !down) return;
      if (focus === 'graph') {
        navigateGraph(up ? 'up' : 'down');
      } else if (focus === 'files') {
        navigateFiles(up ? 'up' : 'down', fileLines);
      }
    },
    [focus, keymap, navigateGraph, navigateFiles]
  );

  // ── Toggle stage/unstage handler ──────────────────────────────────────
  const handleToggleStage = useCallback(
    async (fileLines: FileLine[]) => {
      // Only works on the working directory commit and files panel focus
      if (!repository || displayCommit.hash !== '__WORKING__' || focus !== 'files') {
        return;
      }

      const selectedFile = fileLines[selectedFileIdx];
      if (!selectedFile || selectedFile.isHeader || !selectedFile.stagingState) {
        return;
      }

      const filePath = selectedFile.path;
      try {
        if (selectedFile.stagingState === 'staged') {
          // Unstage the file
          await repository.unstageFile(filePath);
          setCopyStatus(`Unstaged ${filePath}`);
        } else {
          // Stage the file (unstaged or untracked)
          await repository.stageFile(filePath);
          setCopyStatus(`Staged ${filePath}`);
        }

        // Refresh working changes and get the updated state
        let updatedWorkingChanges = workingChanges;
        if (refreshWorkingChanges) {
          const refreshed = await refreshWorkingChanges();
          if (refreshed) {
            updatedWorkingChanges = refreshed;
          }
        }

        // Re-locate the file in the new list and update selection
        // Note: the file may have moved between groups after staging/unstaging
        const updatedFileLines = buildFileLines(displayCommit, updatedWorkingChanges || undefined);
        const newIdx = updatedFileLines.findIndex((f) => f.path === filePath && !f.isHeader);
        if (newIdx !== -1) {
          setSelectedFileIdx(newIdx);
          setFilesScroll((p) => {
            const next = newIdx;
            return next >= p + bottomInnerH ? next - bottomInnerH + 1 : p;
          });
        } else {
          // File not found (shouldn't happen); clamp selection
          setSelectedFileIdx(Math.min(selectedFileIdx, updatedFileLines.length - 1));
        }

        // Clear status message after 1.5 seconds
        setTimeout(() => setCopyStatus(null), 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setCopyStatus(`Error: ${message}`);
        setTimeout(() => setCopyStatus(null), 1500);
      }
    },
    [
      repository,
      displayCommit.hash,
      focus,
      selectedFileIdx,
      bottomInnerH,
      refreshWorkingChanges,
      workingChanges,
      displayCommit,
    ]
  );

  // ── Keyboard input ────────────────────────────────────────────────────
  useInput((input, key) => {
    if (searchOpen) return;
    if (isActionPressed(keymap, KEY_ACTION.quit, input, key)) {
      exit();
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.pick, input, key)) {
      onPickCommit?.(selectedCommit.hash);
      exit();
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.searchNextMatch, input, key)) {
      navigateMatch('next');
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.searchPrevMatch, input, key)) {
      navigateMatch('prev');
      return;
    }
    if (
      isActionPressed(keymap, KEY_ACTION.searchClearMatches, input, key) &&
      matchIndices.length > 0
    ) {
      setMatchIndices([]);
      setActiveMatchIdx(-1);
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.searchOpen, input, key)) {
      setSearchOpen(true);
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.focusCycle, input, key)) {
      cycleTab();
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.clipboardCopySha, input, key)) {
      copyHash();
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.workingToggleStage, input, key)) {
      handleToggleStage(allFileLines);
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.back, input, key)) {
      handleBackOrDelete();
      return;
    }
    if (isActionPressed(keymap, KEY_ACTION.select, input, key)) {
      handleReturn(allFileLines);
      return;
    }
    handleArrowInput(input, key, allFileLines);
  });

  // ── Build info lines ─────────────────────────────────────────────────
  // (consumed internally by CommitInfoPanel; built here only so the call
  //  site is obvious — CommitInfoPanel calls buildInfoLines itself)

  // ── Visible slices ────────────────────────────────────────────────────
  const visibleGraph = useMemo(
    () => graphLines.slice(graphScroll, graphScroll + graphInnerH),
    [graphLines, graphScroll, graphInnerH]
  );

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
              resetBottomPanels();
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
            keymap={keymap}
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
      <Box marginTop={0}>
        <FooterNode
          copyStatus={copyStatus}
          matchCount={matchIndices.length}
          focus={focus}
          isWorkingCommit={displayCommit.hash === '__WORKING__'}
          keymap={keymap}
        />
      </Box>
    </Box>
  );
}
