import { Box, Text, useStdout } from 'ink';
import type { RepoEntry } from '../data/mockRepos.js';

interface CommitScreenProps {
  repo: RepoEntry;
}

export function CommitScreen({ repo }: CommitScreenProps) {
  const { stdout } = useStdout();
  const termCols = stdout.columns ?? 80;
  const termRows = stdout.rows ?? 24;

  return (
    <Box
      flexDirection="column"
      width={Math.max(termCols, 80)}
      height={Math.max(termRows, 24)}
      paddingX={1}
      paddingY={1}
    >
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
        {repo.commits.map((commit) => (
          <Box key={commit.hash} marginBottom={1}>
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
