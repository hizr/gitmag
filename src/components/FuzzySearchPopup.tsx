import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Box, Text, useInput } from 'ink';
import Fuse from 'fuse.js';
import type { CommitEntry } from '../data/mockRepos.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchableCommit {
  idx: number;
  hash: string;
  message: string;
  author: string;
  date: string;
  refs: string;
  files: string;
}

interface SearchResult {
  item: SearchableCommit;
  refIndex: number;
  score: number;
}

interface FuzzySearchPopupProps {
  commits: CommitEntry[];
  onSelect: (commitIdx: number) => void;
  onClose: () => void;
  maxWidth: number;
  maxHeight: number;
}

// ── Panel border helper ───────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  width: number;
  height: number;
  children: ReactNode;
}

function SearchPanel({ label, width, height, children }: PanelProps) {
  const innerWidth = Math.max(width - 4, 1);
  const innerHeight = Math.max(height - 2, 1);

  const topBar = '━'.repeat(Math.max(innerWidth - label.length - 2, 0));
  const top = `┏━ ${label} ${topBar}┓`;
  const bottom = `┗${'━'.repeat(innerWidth + 2)}┛`;

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Text color="cyan">{top}</Text>
      <Box flexDirection="row" height={innerHeight}>
        <Text color="cyan"> </Text>
        <Box flexDirection="column" width={innerWidth} overflow="hidden">
          {children}
        </Box>
        <Text color="cyan"> </Text>
      </Box>
      <Text color="cyan">{bottom}</Text>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FuzzySearchPopup({
  commits,
  onSelect,
  onClose,
  maxWidth,
  maxHeight,
}: FuzzySearchPopupProps) {
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Build searchable index once, memoized
  const searchableCommits = useMemo(() => {
    return commits.map((commit, idx) => ({
      idx,
      hash: commit.hash === '__WORKING__' ? 'WORK' : commit.hash,
      message: commit.message,
      author: commit.author,
      date: commit.date,
      refs: commit.refs.join(' '),
      files: commit.changedFiles.map((f) => f.path).join(' '),
    }));
  }, [commits]);

  // Create Fuse index
  const fuse = useMemo(
    () =>
      new Fuse(searchableCommits, {
        keys: [
          { name: 'message', weight: 2.0 },
          { name: 'hash', weight: 1.5 },
          { name: 'refs', weight: 1.5 },
          { name: 'author', weight: 1.0 },
          { name: 'files', weight: 0.8 },
          { name: 'date', weight: 0.5 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true,
      }),
    [searchableCommits]
  );

  // Search results
  const results = useMemo(() => {
    if (query.trim().length === 0)
      return searchableCommits.map((item) => ({ item, refIndex: 0, score: 0 }));
    return fuse.search(query) as SearchResult[];
  }, [query, fuse, searchableCommits]);

  // Visible results slice
  const innerHeight = Math.max(maxHeight - 4, 1); // Account for input line + borders
  const visibleResults = results.slice(scrollOffset, scrollOffset + innerHeight);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIdx(0);
    setScrollOffset(0);
  }, [query]);

  // Handle keyboard input
  useInput((input, key) => {
    // Printable characters: add to query
    if (
      input &&
      !key.leftArrow &&
      !key.rightArrow &&
      !key.upArrow &&
      !key.downArrow &&
      !key.backspace &&
      !key.delete &&
      !key.return &&
      !key.escape
    ) {
      setQuery((q) => q + input);
      return;
    }

    // Backspace: remove last character
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      return;
    }

    // Navigation within results
    if (key.upArrow || input === 'k') {
      setHighlightIdx((idx) => Math.max(idx - 1, 0));
      if (highlightIdx > 0 && highlightIdx - 1 < scrollOffset) {
        setScrollOffset((off) => Math.max(off - 1, 0));
      }
      return;
    }

    if (key.downArrow || input === 'j') {
      const maxIdx = Math.max(results.length - 1, 0);
      setHighlightIdx((idx) => Math.min(idx + 1, maxIdx));
      if (highlightIdx < results.length - 1 && highlightIdx + 1 >= scrollOffset + innerHeight) {
        setScrollOffset((off) => off + 1);
      }
      return;
    }

    // Select result and close
    if (key.return) {
      if (results.length > 0) {
        const selectedResult = results[highlightIdx];
        if (selectedResult) {
          onSelect(selectedResult.item.idx);
        }
      }
      return;
    }

    // Close popup
    if (key.escape) {
      onClose();
      return;
    }
  });

  const panelWidth = Math.max(maxWidth - 2, 40);
  const panelHeight = maxHeight;

  return (
    <SearchPanel
      label={`Search (${results.length} matches)`}
      width={panelWidth}
      height={panelHeight}
    >
      {/* Input line */}
      <Box marginBottom={0}>
        <Text color="cyan">/</Text>
        <Text>{query}</Text>
        <Text color="gray" dimColor>
          {' '}
          (ESC to close)
        </Text>
      </Box>

      {/* Divider */}
      <Box marginBottom={0}>
        <Text color="gray">{'─'.repeat(Math.max(panelWidth - 4, 20))}</Text>
      </Box>

      {/* Results list */}
      {results.length === 0 ? (
        <Box>
          <Text color="gray" dimColor>
            No matches
          </Text>
        </Box>
      ) : (
        visibleResults.map((result, i) => {
          const globalIdx = scrollOffset + i;
          const isHighlighted = globalIdx === highlightIdx;
          const commit = result.item;
          const marker = isHighlighted ? '▸' : ' ';
          const displayHash = commit.hash.slice(0, 7).padEnd(7);
          const msgWidth = Math.max(panelWidth - 20, 20);
          const displayMsg = commit.message.slice(0, msgWidth).padEnd(msgWidth);

          return (
            <Box key={`result-${globalIdx}`}>
              <Text color={isHighlighted ? 'cyan' : 'white'} inverse={isHighlighted}>
                {marker} {displayHash} {displayMsg}
              </Text>
            </Box>
          );
        })
      )}

      {/* Fill empty space */}
      {Array.from({ length: Math.max(innerHeight - visibleResults.length - 2, 0) }).map((_, i) => (
        <Box key={`empty-${i}`}>
          <Text> </Text>
        </Box>
      ))}

      {/* Result counter */}
      <Box marginTop={0}>
        <Text color="gray" dimColor>
          [{highlightIdx + 1}/{results.length}]
        </Text>
      </Box>
    </SearchPanel>
  );
}
