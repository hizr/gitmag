import SelectInput from 'ink-select-input';
import { Box, Text } from 'ink';
import type { Repository } from '../types/index.js';
import { pluralise } from '../utils/format.js';

interface RepoListProps {
  repos: Repository[];
  onSelect: (repo: Repository) => void;
}

export function RepoList({ repos, onSelect }: RepoListProps) {
  const items = repos.map((repo) => {
    const authorCount = repo.authors.length;
    const label =
      `${repo.name}  ` +
      `+${repo.totalCommits} ${pluralise(repo.totalCommits, 'commit').split(' ')[0]}` +
      `  ${pluralise(authorCount, 'author')}`;

    return { label, value: repo };
  });

  if (items.length === 0) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>No repositories with activity in this time window.</Text>
        <Text dimColor>Try running with --since 7d to extend the window.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Repositories</Text>
      </Box>
      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate Enter select q quit</Text>
      </Box>
    </Box>
  );
}
