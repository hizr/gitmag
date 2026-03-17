import { type ReactNode } from 'react';
import { Box, Text, useStdout } from 'ink';
import type { ScanProgress } from './Scanner.js';
import type { RepoEntry, BranchInfo } from '../data/mockRepos.js';

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

// ── Branch info panel ─────────────────────────────────────────────────────────

interface BranchInfoPanelProps {
  branchInfo: BranchInfo | undefined;
  width: number;
}

function BranchInfoPanel({ branchInfo, width }: BranchInfoPanelProps) {
  if (!branchInfo) {
    return (
      <Panel label="Branch Info" width={width} height={5}>
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

  // Format working changes summary (from the repo, we'd need to pass it separately)
  // For now, just show the branch status
  const statusStr = branchInfo.remoteBranch
    ? `${branchInfo.remoteBranch}  ${aheadBehindStr}`
    : '(no upstream)';

  return (
    <Panel label="Branch Info" width={width} height={5}>
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

export function RepoScreen({ repos, selectedIdx, scanProgress }: RepoScreenProps) {
  const { stdout } = useStdout();
  const termCols = Math.max(stdout.columns ?? 80, 80);
  const termRows = Math.max(stdout.rows ?? 24, 24);

  // ── Layout dimensions ────────────────────────────────────────────────
  const availableRows = termRows - 4; // header (2) + footer (2)
  const branchPanelHeight = 5; // Fixed height for branch info
  const repoPanelHeight = Math.max(availableRows - branchPanelHeight - 1, 5); // Remaining rows with gap

  const selectedRepo = repos[selectedIdx];

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

      {/* Branch info panel */}
      <Box marginBottom={1}>
        <BranchInfoPanel branchInfo={selectedRepo?.branchInfo} width={termCols - 2} />
      </Box>

      {/* Repo list panel */}
      <Panel label="Repositories" width={termCols - 2} height={repoPanelHeight}>
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
