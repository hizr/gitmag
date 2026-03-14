import { Box, Text, useInput } from 'ink';
import type { RepoEntry } from '../data/mockRepos.js';

interface CommitScreenProps {
  repo: RepoEntry;
  onBack: () => void;
}

export function CommitScreen({ repo, onBack }: CommitScreenProps) {
  useInput((_input, key) => {
    // Back: Escape
    if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header with breadcrumb */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          gitmag
        </Text>
        <Text color="gray"> › </Text>
        <Text color="yellow">{repo.path}</Text>
      </Box>

      {/* Separator */}
      <Box marginBottom={1}>
        <Text>{'-'.repeat(50)}</Text>
      </Box>

      {/* Commit list */}
      <Box flexDirection="column">
        {repo.commits.map((commit, idx) => (
          <Box key={idx} marginBottom={1}>
            <Text color="green">{commit.hash}</Text>
            <Text> </Text>
            <Text>{commit.message}</Text>
            <Text color="gray"> ({commit.date})</Text>
          </Box>
        ))}
      </Box>

      {/* Footer with instructions */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          esc to go back • q to quit
        </Text>
      </Box>
    </Box>
  );
}
