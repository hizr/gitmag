import { useState } from 'react';
import SelectInput from 'ink-select-input';
import { Box, Text, useInput, useStdin, useApp } from 'ink';
import type { Repository } from '../types/index.js';
import { pluralise } from '../utils/format.js';

interface RepoListProps {
  repos: Repository[];
  onSelect: (repo: Repository) => void;
}

/** Keyboard handler for RepoList — detects Esc/q to quit. */
function RepoKeyboardHandler({
  selectedIndex,
  items,
  onSelect,
  onQuit,
}: {
  selectedIndex: number;
  items: Array<{ label: string; value: Repository }>;
  onSelect: (repo: Repository) => void;
  onQuit: () => void;
}) {
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onQuit();
    } else if (key.return) {
      const item = items[selectedIndex];
      if (item) onSelect(item.value);
    }
  });
  return null;
}

export function RepoList({ repos, onSelect }: RepoListProps) {
  const { isRawModeSupported } = useStdin();
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);

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
      {isRawModeSupported && (
        <RepoKeyboardHandler
          selectedIndex={selectedIndex}
          items={items}
          onSelect={onSelect}
          onQuit={exit}
        />
      )}
      <Box marginBottom={1}>
        <Text bold>Repositories</Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={(item) => onSelect(item.value)}
        onHighlight={(item) => {
          const idx = items.findIndex((i) => i.value.path === item.value.path);
          if (idx >= 0) setSelectedIndex(idx);
        }}
      />
      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate Enter select q quit</Text>
      </Box>
    </Box>
  );
}
