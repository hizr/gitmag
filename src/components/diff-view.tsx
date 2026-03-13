import { useState, useMemo } from 'react';
import { Box, Text, useInput, useStdin, useStdout } from 'ink';
import type { Commit, FileChange } from '../types/index.js';
import { parseDiff } from '../utils/diff-parser.js';
import { tokenise } from '../utils/syntax-highlight.js';
import type { DiffRow } from '../utils/diff-parser.js';

const LINES_PER_SIDE = 3; // gutter width for line numbers
const GUTTER_WIDTH = LINES_PER_SIDE + 1; // "123 "
const SEPARATOR = ' │ ';

interface DiffViewProps {
  repoPath: string;
  commit: Commit;
  file: FileChange;
  rawDiff: string;
  onBack: () => void;
}

/** Render one side of a diff row (left or right) with syntax highlighting. */
function DiffSide({
  lineNo,
  content,
  type,
  filePath,
  width,
}: {
  lineNo: number | null;
  content: string;
  type: 'add' | 'del' | 'context' | 'empty';
  filePath: string;
  width: number;
}) {
  const bgColor = type === 'add' ? 'green' : type === 'del' ? 'red' : undefined;
  const dimmed = type === 'empty';

  // Line number gutter
  const lineNoStr =
    lineNo !== null ? String(lineNo).padStart(GUTTER_WIDTH - 1) + ' ' : ' '.repeat(GUTTER_WIDTH);

  // Truncate content to fit
  const maxContent = Math.max(0, width - GUTTER_WIDTH);
  const displayContent =
    content.length > maxContent
      ? content.slice(0, maxContent - 1) + '…'
      : content.padEnd(maxContent);

  const tokens = type !== 'empty' && content ? tokenise(displayContent, filePath) : null;

  return (
    <Box width={width} flexDirection="row" flexShrink={0}>
      <Text dimColor>{lineNoStr}</Text>
      {dimmed || !tokens ? (
        <Text>{displayContent}</Text>
      ) : (
        <>
          {tokens.map((token, i) => (
            <Text key={i} color={bgColor ? 'white' : token.color} backgroundColor={bgColor}>
              {token.text}
            </Text>
          ))}
        </>
      )}
    </Box>
  );
}

function DiffKeyboardHandler({
  scrollOffset,
  setScrollOffset,
  maxOffset,
  onBack,
}: {
  scrollOffset: number;
  setScrollOffset: (n: number) => void;
  maxOffset: number;
  onBack: () => void;
}) {
  useInput((_input, key) => {
    if (key.upArrow) {
      setScrollOffset(Math.max(0, scrollOffset - 1));
    } else if (key.downArrow) {
      setScrollOffset(Math.min(maxOffset, scrollOffset + 1));
    } else if (key.pageDown) {
      setScrollOffset(Math.min(maxOffset, scrollOffset + 20));
    } else if (key.pageUp) {
      setScrollOffset(Math.max(0, scrollOffset - 20));
    } else if (key.escape || _input === 'q') {
      onBack();
    }
  });
  return null;
}

export function DiffView({ repoPath: _repoPath, commit, file, rawDiff, onBack }: DiffViewProps) {
  const { isRawModeSupported } = useStdin();
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);

  const termWidth = stdout?.columns ?? 120;
  const sideWidth = Math.floor((termWidth - SEPARATOR.length) / 2);
  // Lines available for the diff body (leave room for header, footer, hunk headers)
  const visibleLines = Math.max(10, (stdout?.rows ?? 40) - 6);

  // Memoize diff parsing to avoid re-parsing on every render/scroll
  const parsed = useMemo(() => parseDiff(rawDiff), [rawDiff]);
  const fileDiff = parsed[0];

  // Early exit for binary files
  if (file.binary) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="row" gap={1}>
          <Text bold color="yellow">
            {commit.hash}
          </Text>
          <Text bold>{file.path}</Text>
        </Box>
        <Text color="gray">(Binary file — no text diff available)</Text>
        <Text dimColor>Press Esc to go back.</Text>
        {isRawModeSupported && (
          <DiffKeyboardHandler
            scrollOffset={0}
            setScrollOffset={() => undefined}
            maxOffset={0}
            onBack={onBack}
          />
        )}
      </Box>
    );
  }

  if (!fileDiff) {
    return (
      <Box flexDirection="column">
        <Text color="red">No diff available for this file.</Text>
        <Text dimColor>Press Esc to go back.</Text>
        {isRawModeSupported && (
          <DiffKeyboardHandler
            scrollOffset={0}
            setScrollOffset={() => undefined}
            maxOffset={0}
            onBack={onBack}
          />
        )}
      </Box>
    );
  }

  // Flatten all rows from all hunks for scrolling, interspersed with hunk headers
  type FlatItem = { kind: 'hunk-header'; text: string } | { kind: 'row'; row: DiffRow };

  const flat: FlatItem[] = [];
  for (const hunk of fileDiff.hunks) {
    flat.push({ kind: 'hunk-header', text: hunk.header });
    for (const row of hunk.rows) {
      flat.push({ kind: 'row', row });
    }
  }

  const maxOffset = Math.max(0, flat.length - visibleLines);
  const visible = flat.slice(scrollOffset, scrollOffset + visibleLines);

  return (
    <Box flexDirection="column">
      {isRawModeSupported && (
        <DiffKeyboardHandler
          scrollOffset={scrollOffset}
          setScrollOffset={setScrollOffset}
          maxOffset={maxOffset}
          onBack={onBack}
        />
      )}

      {/* Header */}
      <Box marginBottom={1} flexDirection="row" gap={1}>
        <Text bold color="yellow">
          {commit.hash}
        </Text>
        <Text bold>{file.path}</Text>
      </Box>

      {/* Column headers */}
      <Box flexDirection="row">
        <Box width={sideWidth}>
          <Text dimColor bold>
            {'OLD'.padEnd(sideWidth)}
          </Text>
        </Box>
        <Text dimColor>{SEPARATOR}</Text>
        <Box width={sideWidth}>
          <Text dimColor bold>
            NEW
          </Text>
        </Box>
      </Box>

      {/* Diff rows */}
      {visible.map((item, i) => {
        if (item.kind === 'hunk-header') {
          return (
            <Box key={`hunk-${i}`}>
              <Text color="cyan" dimColor>
                {item.text}
              </Text>
            </Box>
          );
        }

        const { left, right } = item.row;
        return (
          <Box key={`row-${scrollOffset + i}`} flexDirection="row">
            <DiffSide
              lineNo={left.lineNo}
              content={left.content}
              type={left.type}
              filePath={file.path}
              width={sideWidth}
            />
            <Text dimColor>{SEPARATOR}</Text>
            <DiffSide
              lineNo={right.lineNo}
              content={right.content}
              type={right.type}
              filePath={file.path}
              width={sideWidth}
            />
          </Box>
        );
      })}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          ↑↓ scroll PgUp/PgDn fast scroll Esc back {scrollOffset + 1}–
          {Math.min(scrollOffset + visibleLines, flat.length)}/{flat.length}
        </Text>
      </Box>
    </Box>
  );
}
