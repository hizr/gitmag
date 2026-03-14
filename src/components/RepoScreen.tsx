import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ScanProgress } from './Scanner.js';
import type { RepoEntry } from '../data/mockRepos.js';
import { MOCK_REPOS } from '../data/mockRepos.js';

interface RepoScreenProps {
  scanProgress: ScanProgress;
  onSelect: (repo: RepoEntry) => void;
  onBack: () => void;
}

export function RepoScreen({ scanProgress, onSelect, onBack }: RepoScreenProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useInput((input, key) => {
    // Navigate down: ArrowDown or 'j'
    if (key.downArrow || input === 'j') {
      setSelectedIdx((prev) => Math.min(prev + 1, MOCK_REPOS.length - 1));
    }

    // Navigate up: ArrowUp or 'k'
    if (key.upArrow || input === 'k') {
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    }

    // Select: Enter
    if (key.return) {
      const selectedRepo = MOCK_REPOS[selectedIdx];
      if (selectedRepo) {
        onSelect(selectedRepo);
      }
    }

    // Back: Escape
    if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          gitmag
        </Text>
        <Text color="gray">{` — ${scanProgress.phase}`}</Text>
      </Box>

      {/* Separator */}
      <Box marginBottom={1}>
        <Text>{'-'.repeat(50)}</Text>
      </Box>

      {/* Repo list */}
      <Box flexDirection="column">
        {MOCK_REPOS.map((repo, repoIdx) => {
          const isSelected = repoIdx === selectedIdx;
          return (
            <Box key={repoIdx} flexDirection="column" marginBottom={1}>
              {/* Repo path — highlighted if selected */}
              <Text color={isSelected ? 'bgCyan' : 'yellow'} inverse={isSelected}>
                {isSelected ? '> ' : '  '}
                {repo.path}
              </Text>

              {/* Commits for this repo */}
              {repo.commits.map((commit, commitIdx) => (
                <Box key={commitIdx} marginLeft={2}>
                  <Text color="green">{commit.hash}</Text>
                  <Text> </Text>
                  <Text>{commit.message}</Text>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>

      {/* Footer with instructions */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          j/k (or arrows) to navigate • enter to select • esc to go back • q to quit
        </Text>
      </Box>
    </Box>
  );
}
