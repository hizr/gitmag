import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import type { CommitEntry } from '../../data/mockRepos.js';
import { Panel } from '../common/Panel.js';
import { buildInfoLines } from './commit-screen.utils.js';

interface CommitInfoPanelProps {
  readonly commit: CommitEntry;
  readonly width: number;
  readonly height: number;
  readonly infoScroll: number;
  readonly innerHeight: number;
}

export const CommitInfoPanel = memo(function CommitInfoPanel({
  commit,
  width,
  height,
  infoScroll,
  innerHeight,
}: CommitInfoPanelProps) {
  const { infoLines, bodyLines } = useMemo(() => buildInfoLines(commit), [commit]);
  const allInfoLines = useMemo(
    () => [...infoLines.map((l) => `${l.label}  ${l.value}`), ...bodyLines],
    [infoLines, bodyLines]
  );
  const visibleInfo = useMemo(
    () => allInfoLines.slice(infoScroll, infoScroll + innerHeight),
    [allInfoLines, infoScroll, innerHeight]
  );

  return (
    <Panel label="Commit Info" focused={false} width={width} height={height}>
      {visibleInfo.map((line, i) => {
        const isHeader = i + infoScroll < infoLines.length;
        if (isHeader) {
          const entry = infoLines[i + infoScroll]!;
          // For wrappable fields like Message, use a separate layout
          if (entry.wrap) {
            const labelWidth = entry.label.length;
            const availableWidth = Math.max(width - labelWidth - 9, 20); // 9 = borders + spacing
            return (
              <Box key={`info-${i}`} flexDirection="column">
                <Box marginBottom={0}>
                  <Text color="cyan">{entry.label}</Text>
                  <Text color="gray"> </Text>
                  <Box width={availableWidth} flexDirection="column">
                    <Text wrap="wrap">{entry.value}</Text>
                  </Box>
                </Box>
              </Box>
            );
          }
          // Standard single-line layout
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
      {Array.from({ length: Math.max(innerHeight - visibleInfo.length, 0) }).map((_, i) => (
        <Text key={`empty-info-${i}`}> </Text>
      ))}
    </Panel>
  );
});
