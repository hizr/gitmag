import { Box, Static, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import type { ScanEvent } from '../types/index.js';

interface ScanLogLine {
  id: string;
  text: string;
  color?: string;
  dimColor?: boolean;
}

interface ScanLogProps {
  scanDir: string;
  depth: number;
  events: ScanEvent[];
  isComplete: boolean;
}

function buildLogLines(events: ScanEvent[]): ScanLogLine[] {
  const lines: ScanLogLine[] = [];

  for (const event of events) {
    if (event.type === 'found') {
      lines.push({
        id: `found-${event.repoPath}`,
        text: `✓ Found ${event.repoName}`,
        color: 'green',
      });
    } else if (event.type === 'fetching') {
      // fetching lines are shown as the active spinner line, not static
      // but we include them for completeness when building the final log
    } else if (event.type === 'fetched') {
      const authorLabel = event.authorCount === 1 ? 'author' : 'authors';
      const commitLabel = event.commitCount === 1 ? 'commit' : 'commits';
      lines.push({
        id: `fetched-${event.repoPath}`,
        text: `  ✓ ${event.repoName}: ${event.commitCount} ${commitLabel}, ${event.authorCount} ${authorLabel}`,
        color: 'green',
      });
    } else if (event.type === 'done') {
      lines.push({
        id: 'done',
        text: `  Scanned ${event.totalDirs} dirs · Found ${event.totalRepos} repos · ${event.activeRepos} active`,
        dimColor: true,
      });
    }
  }

  return lines;
}

function getActiveStatus(events: ScanEvent[]): string | null {
  // Find the last fetching event that hasn't been completed yet
  const fetchingRepos = new Set<string>();
  const fetchedRepos = new Set<string>();

  for (const event of events) {
    if (event.type === 'fetching') fetchingRepos.add(event.repoPath);
    if (event.type === 'fetched') fetchedRepos.add(event.repoPath);
  }

  for (const repoPath of fetchingRepos) {
    if (!fetchedRepos.has(repoPath)) {
      const event = events.find((e) => e.type === 'fetching' && e.repoPath === repoPath);
      if (event && event.type === 'fetching') {
        return `Fetching activity for ${event.repoName}...`;
      }
    }
  }

  return null;
}

export function ScanLog({ scanDir, depth, events, isComplete }: ScanLogProps) {
  const logLines = buildLogLines(events);
  const activeStatus = isComplete ? null : getActiveStatus(events);
  const isScanning = !isComplete;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Static completed log lines */}
      <Static items={logLines}>
        {(line) => (
          <Box key={line.id} marginLeft={2}>
            <Text color={line.color} dimColor={line.dimColor}>
              {line.text}
            </Text>
          </Box>
        )}
      </Static>

      {/* Active spinner line */}
      {isScanning && (
        <Box marginLeft={2} marginTop={1} flexDirection="column" gap={1}>
          <Box gap={1}>
            <Spinner label={`Scanning ${scanDir} (depth: ${depth})...`} />
          </Box>
          {activeStatus && (
            <Box marginLeft={2}>
              <Text dimColor>{activeStatus}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
