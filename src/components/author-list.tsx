import { useState } from 'react';
import SelectInput from 'ink-select-input';
import { Box, Text, useInput, useStdin } from 'ink';
import type { Author } from '../types/index.js';
import { pluralise } from '../utils/format.js';

interface AuthorListProps {
  authors: Author[];
  repoName: string;
  onSelect: (author: Author) => void;
  onBack: () => void;
}

/** Keyboard handler for AuthorList — detects Esc to go back. */
function AuthorKeyboardHandler({
  selectedIndex,
  items,
  onSelect,
  onBack,
}: {
  selectedIndex: number;
  items: Array<{ label: string; value: Author }>;
  onSelect: (author: Author) => void;
  onBack: () => void;
}) {
  useInput((_input, key) => {
    if (key.escape) {
      onBack();
    } else if (key.return) {
      const item = items[selectedIndex];
      if (item) onSelect(item.value);
    }
  });
  return null;
}

export function AuthorList({ authors, repoName: _repoName, onSelect, onBack }: AuthorListProps) {
  const { isRawModeSupported } = useStdin();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = authors.map((author) => {
    const label =
      `${author.name}  ` +
      `${pluralise(author.commits.length, 'commit')}  ` +
      `+${author.totalAdditions}/-${author.totalDeletions}`;
    return { label, value: author };
  });

  return (
    <Box flexDirection="column">
      {isRawModeSupported && (
        <AuthorKeyboardHandler
          selectedIndex={selectedIndex}
          items={items}
          onSelect={onSelect}
          onBack={onBack}
        />
      )}
      <Box marginBottom={1}>
        <Text bold>Authors</Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={(item) => onSelect(item.value)}
        onHighlight={(item) => {
          const idx = items.findIndex((i) => i.value.email === item.value.email);
          if (idx >= 0) setSelectedIndex(idx);
        }}
      />
      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate Enter select Esc back</Text>
      </Box>
    </Box>
  );
}
