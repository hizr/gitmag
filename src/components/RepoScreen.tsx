import { Box, Text, useStdout } from 'ink';
import type { ScanProgress } from './Scanner.js';
import { MOCK_REPOS } from '../data/mockRepos.js';

interface RepoScreenProps {
  scanProgress: ScanProgress;
  selectedIdx: number;
}

export function RepoScreen({ scanProgress, selectedIdx }: RepoScreenProps) {
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
            <Box key={repo.path} flexDirection="column" marginBottom={1}>
              {/* Repo path — highlighted if selected */}
              <Text color={isSelected ? 'bgCyan' : 'yellow'} inverse={isSelected}>
                {isSelected ? '> ' : '  '}
                {repo.path}
              </Text>

              {/* Commits for this repo */}
              {repo.commits.map((commit) => (
                <Box key={commit.hash} marginLeft={2}>
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
          j/k (or arrows) to navigate • enter to select • backspace to go back • q to quit
        </Text>
      </Box>
    </Box>
  );
}
