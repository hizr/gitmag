import { Box, Text } from 'ink';

interface HeaderProps {
  repoCount: number;
  windowLabel: string;
}

export function Header({ repoCount, windowLabel }: HeaderProps) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const repoLabel = repoCount === 1 ? '1 active repo' : `${repoCount} active repos`;

  return (
    <Box borderStyle="double" paddingX={2} marginBottom={1}>
      <Text bold color="cyan">
        Git Magazine
      </Text>
      <Text dimColor>{'  —  '}</Text>
      <Text dimColor>{dateLabel}</Text>
      <Text dimColor>{'  —  '}</Text>
      <Text dimColor>{windowLabel}</Text>
      <Text dimColor>{'  —  '}</Text>
      <Text color="yellow">{repoLabel}</Text>
    </Box>
  );
}
