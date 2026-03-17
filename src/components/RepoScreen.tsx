import { type ReactNode } from 'react';
import { Box, Text, useStdout } from 'ink';
import type { ScanProgress } from './Scanner.js';
import type { RepoEntry } from '../data/mockRepos.js';

interface RepoScreenProps {
  repos: RepoEntry[];
  selectedIdx: number;
  scanProgress: ScanProgress;
}

// ── Panel border helper ───────────────────────────────────────────────────────

interface PanelProps {
  label: string;
  width: number;
  height: number;
  children: ReactNode;
}

function Panel({ label, width, height, children }: PanelProps) {
  const borderColor = 'cyan';
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

export function RepoScreen({ repos, selectedIdx, scanProgress }: RepoScreenProps) {
  const { stdout } = useStdout();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  // ── Layout dimensions ────────────────────────────────────────────────
  const availableRows = termRows - 4; // header (2) + footer (2)
  const panelHeight = Math.max(availableRows, 5);

  return (
    <Box flexDirection="column" width={termCols} height={termRows} paddingX={1}>
      {/* Header */}
      <Box marginBottom={0}>
        <Text bold color="cyan">
          gitmag
        </Text>
        <Text color="gray">{` — ${scanProgress.phase}`}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">{'─'.repeat(termCols - 2)}</Text>
      </Box>

      {/* Repo list panel */}
      <Panel label="Repositories" width={termCols - 2} height={panelHeight}>
        <Box flexDirection="column">
          {repos.map((repo, repoIdx) => {
            const isSelected = repoIdx === selectedIdx;
            return (
              <Box key={repo.path} flexDirection="column" marginBottom={1}>
                {/* Repo path — highlighted if selected */}
                <Text color={isSelected ? 'bgCyan' : 'yellow'} inverse={isSelected}>
                  {isSelected ? '> ' : '  '}
                  {repo.path}
                </Text>

                {/* Commits for this repo */}
                {repo.commits.map((commit) => (
                  <Box key={commit.hash} marginLeft={2}>
                    <Text color="green">{commit.hash}</Text>
                    <Text> </Text>
                    <Text>{commit.message}</Text>
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      </Panel>

      {/* Footer with instructions */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          [j/k] navigate [enter] select [bksp] back [q] quit
        </Text>
      </Box>
    </Box>
  );
}
