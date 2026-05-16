import { Text } from 'ink';

interface FooterNodeProps {
  readonly copyStatus: string | null;
  readonly matchCount: number;
  readonly focus: 'graph' | 'files';
  readonly isWorkingCommit: boolean;
}

export function FooterNode({ copyStatus, matchCount, focus, isWorkingCommit }: FooterNodeProps) {
  if (copyStatus) {
    return (
      <Text color="green" bold>
        {copyStatus}
      </Text>
    );
  }

  if (matchCount > 0) {
    return (
      <Text color="gray" dimColor>
        [n/m] next/prev match ({matchCount} results) [/] new search [ESC] clear [up/down] navigate
        [q] quit
      </Text>
    );
  }

  const showStageHint = focus === 'files' && isWorkingCommit;

  return (
    <Text color="gray" dimColor>
      [/] search [up/down] navigate [enter] select/diff
      {showStageHint ? ' [+] stage/unstage' : ''} [c] copy SHA [p] pick [bksp/del] back [q] quit
    </Text>
  );
}
