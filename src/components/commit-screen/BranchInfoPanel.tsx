import { Box, Text } from 'ink';
import type { BranchInfo } from '../../data/mockRepos.js';
import { Panel } from '../common/Panel.js';

interface BranchInfoPanelProps {
  readonly branchInfo: BranchInfo | undefined;
  readonly width: number;
}

export function BranchInfoPanel({ branchInfo, width }: BranchInfoPanelProps) {
  if (!branchInfo) {
    return (
      <Panel label="Branch Info" focused={false} width={width} height={5}>
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
  let aheadBehindStr: string;
  if (branchInfo.remoteBranch && (branchInfo.ahead > 0 || branchInfo.behind > 0)) {
    aheadBehindStr = `↑${branchInfo.ahead} ↓${branchInfo.behind}`;
  } else if (branchInfo.remoteBranch) {
    aheadBehindStr = '✓';
  } else {
    aheadBehindStr = '—';
  }

  // Format remote tracking display
  const statusStr = branchInfo.remoteBranch
    ? `${branchInfo.remoteBranch}  ${aheadBehindStr}`
    : '(no upstream)';

  return (
    <Panel label="Branch Info" focused={false} width={width} height={5}>
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
