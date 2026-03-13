import { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import type { Commit, FileChange } from '../types/index.js';
import { relativeDate, truncate } from '../utils/format.js';

interface CommitListProps {
  commits: Commit[];
  authorName: string;
  repoName: string;
  onSelectFile: (commit: Commit, file: FileChange) => void;
  onBack: () => void;
}

/**
 * Flattens the commit list into a single array of selectable rows:
 * either a commit header row or a file row.
 */
type CommitRow = { kind: 'commit'; commit: Commit; index: number };
type FileRow = { kind: 'file'; commit: Commit; file: FileChange; treeChar: string };
type Row = CommitRow | FileRow;

function buildRows(commits: Commit[]): Row[] {
  const rows: Row[] = [];
  commits.forEach((commit, index) => {
    rows.push({ kind: 'commit', commit, index });
    commit.files.forEach((file, fi) => {
      const isLast = fi === commit.files.length - 1;
      rows.push({ kind: 'file', commit, file, treeChar: isLast ? '└──' : '├──' });
    });
  });
  return rows;
}

/** Keyboard handler — only mounted when raw mode is available. */
function CommitKeyboardHandler({
  rows,
  cursor,
  setCursor,
  onSelectFile,
  onBack,
}: {
  rows: Row[];
  cursor: number;
  setCursor: (n: number) => void;
  onSelectFile: (commit: Commit, file: FileChange) => void;
  onBack: () => void;
}) {
  useInput((_input, key) => {
    if (key.upArrow) {
      setCursor(Math.max(0, cursor - 1));
    } else if (key.downArrow) {
      setCursor(Math.min(rows.length - 1, cursor + 1));
    } else if (key.return) {
      const row = rows[cursor];
      if (row && row.kind === 'file') {
        onSelectFile(row.commit, row.file);
      }
    } else if (key.escape || _input === 'q') {
      onBack();
    }
  });
  return null;
}

export function CommitList({
  commits,
  authorName,
  repoName: _repoName,
  onSelectFile,
  onBack,
}: CommitListProps) {
  const { isRawModeSupported } = useStdin();
  const rows = buildRows(commits);
  const [cursor, setCursor] = useState(0);

  // Find first selectable file row index to start on a useful position
  const firstFile = rows.findIndex((r) => r.kind === 'file');
  const effectiveCursor = cursor === 0 && firstFile > 0 ? 0 : cursor;

  return (
    <Box flexDirection="column">
      {isRawModeSupported && (
        <CommitKeyboardHandler
          rows={rows}
          cursor={effectiveCursor}
          setCursor={setCursor}
          onSelectFile={onSelectFile}
          onBack={onBack}
        />
      )}

      <Box marginBottom={1}>
        <Text bold>Commits — </Text>
        <Text color="cyan">{authorName}</Text>
      </Box>

      {rows.map((row, i) => {
        const isSelected = i === effectiveCursor;

        if (row.kind === 'commit') {
          return (
            <Box key={`commit-${row.commit.hash}`} flexDirection="row" gap={1}>
              <Text color="yellow">{row.commit.hash}</Text>
              <Text bold={isSelected} color={isSelected ? 'white' : undefined}>
                {truncate(row.commit.message, 60)}
              </Text>
              <Text dimColor>{relativeDate(row.commit.date)}</Text>
            </Box>
          );
        }

        // File row
        const isFileCursor = isSelected && row.kind === 'file';
        const prefix = `    ${row.treeChar} `;
        return (
          <Box key={`file-${row.commit.hash}-${row.file.path}`} flexDirection="row">
            <Text dimColor={!isFileCursor}>{prefix}</Text>
            <Text
              color={isFileCursor ? 'cyan' : undefined}
              bold={isFileCursor}
              underline={isFileCursor}
            >
              {row.file.path}
            </Text>
            {!row.file.binary && (
              <Text dimColor>
                {'  '}
                <Text color="green">+{row.file.additions}</Text>
                <Text color="red">-{row.file.deletions}</Text>
              </Text>
            )}
            {row.file.binary && <Text dimColor> (binary)</Text>}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate Enter open diff Esc back</Text>
      </Box>
    </Box>
  );
}
