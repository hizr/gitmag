import { Box, Text } from 'ink';
import type { ScanProgress } from './Scanner.js';
import { MOCK_REPOS } from '../data/mockRepos.js';

interface RepoScreenProps {
  scanProgress: ScanProgress;
}

export function RepoScreen({ scanProgress }: RepoScreenProps) {
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

      {/* Repo + commit list */}
      <Box flexDirection="column">
        {MOCK_REPOS.map((repo, repoIdx) => (
          <Box key={repoIdx} flexDirection="column" marginBottom={1}>
            {/* Repo path */}
            <Text color="yellow">{repo.path}</Text>

            {/* Commits for this repo */}
            {repo.commits.map((commit, commitIdx) => (
              <Box key={commitIdx} marginLeft={2}>
                <Text color="green">{commit.hash}</Text>
                <Text> </Text>
                <Text>{commit.message}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
