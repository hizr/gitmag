import { Box, Text } from 'ink';
import { Panel } from '../common/Panel.js';
import { FILE_STATUS_COLOR, type FileLine } from './commit-screen.utils.js';

interface ChangedFilesPanelProps {
  readonly fileLines: FileLine[];
  readonly selectedFileIdx: number;
  readonly filesScroll: number;
  readonly width: number;
  readonly height: number;
  readonly innerHeight: number;
  readonly focused: boolean;
}

export function ChangedFilesPanel({
  fileLines,
  selectedFileIdx,
  filesScroll,
  width,
  height,
  innerHeight,
  focused,
}: ChangedFilesPanelProps) {
  const visibleFiles = fileLines.slice(filesScroll, filesScroll + innerHeight);

  return (
    <Panel label="Changed Files" focused={focused} width={width} height={height}>
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
      {fileLines.length === 0 && (
        <Text color="gray" dimColor>
          No changed files
        </Text>
      )}
      {Array.from({
        length: Math.max(
          innerHeight - Math.max(visibleFiles.length, fileLines.length === 0 ? 1 : 0),
          0
        ),
      }).map((_, i) => (
        <Text key={`empty-files-${i}`}> </Text>
      ))}
    </Panel>
  );
}
