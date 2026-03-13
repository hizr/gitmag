import SelectInput from 'ink-select-input';
import { Box, Text } from 'ink';
import type { Author } from '../types/index.js';
import { pluralise } from '../utils/format.js';

interface AuthorListProps {
  authors: Author[];
  repoName: string;
  onSelect: (author: Author) => void;
  onBack: () => void;
}

export function AuthorList({
  authors,
  repoName: _repoName,
  onSelect,
  onBack: _onBack,
}: AuthorListProps) {
  const items = authors.map((author) => {
    const label =
      `${author.name}  ` +
      `${pluralise(author.commits.length, 'commit')}  ` +
      `+${author.totalAdditions}/-${author.totalDeletions}`;
    return { label, value: author };
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Authors</Text>
      </Box>
      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate Enter select Esc back</Text>
      </Box>
    </Box>
  );
}
