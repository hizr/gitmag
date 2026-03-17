import { useState } from 'react';
import { Box, Text } from 'ink';
import { SplashScreen } from './components/SplashScreen.js';
import { CommitScreen } from './components/CommitScreen.js';
import { FileDiffScreen } from './components/FileDiffScreen.js';
import { useRepository } from './hooks/useRepository.js';
import { useQuit } from './hooks/useQuit.js';
import type { ScanProgress } from './components/Scanner.js';
import type { RepoEntry, CommitEntry, ChangedFile } from './data/mockRepos.js';

export type Route =
  | { name: 'commit'; repoPath: string; repo: RepoEntry }
  | {
      name: 'diff';
      repo: RepoEntry;
      commit: CommitEntry;
      file: ChangedFile;
      getDiff: () => Promise<string>;
      selectedFileIdx: number;
      selectedCommitIdx: number;
    };

export function App() {
  const [screen, setScreen] = useState<'splash' | 'router'>('splash');
  const [stack, setStack] = useState<Route[]>([]);
  const [selectedCommitIdx, setSelectedCommitIdx] = useState(0);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const {
    repos,
    loading: repoLoading,
    error: repoError,
    phase,
    repository,
    workingChanges,
  } = useRepository(process.cwd());

  // Derive ScanProgress from useRepository
  const scanProgress: ScanProgress = {
    phase,
    done: !repoLoading,
  };

  const push = (route: Route) => setStack((prev) => [...prev, route]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const current = stack[stack.length - 1];

  // Handle quit key ('q') when on router (not on splash screen)
  useQuit(screen === 'router');

  // No longer need to manage repo list navigation — all screens handle their own input
  // useAppInput only needed for quit key, but that's handled by root shell wrapper

  if (screen === 'splash') {
    return (
      <SplashScreen
        onComplete={() => {
          // Clear terminal and transition to router screen
          if (process.stdout.isTTY) {
            process.stdout.write('\u001B[2J\u001B[0f');
          }
          // Navigate directly to commit screen with the first (and only) repo
          const repo = repos[0];
          if (repo) {
            setStack([{ name: 'commit', repoPath: repo.path, repo }]);
          }
          setScreen('router');
        }}
        scanProgress={scanProgress}
      />
    );
  }

  // Handle error or empty state (shouldn't happen if splash waits for done, but safety check)
  if (repoError) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          gitmag
        </Text>
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="red" padding={1}>
          <Text color="red" bold>
            Error Loading Repository
          </Text>
          <Text color="white">{repoError}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Press q to quit
          </Text>
        </Box>
      </Box>
    );
  }

  if (repos.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          gitmag
        </Text>
        <Text color="gray" dimColor>
          No repositories found
        </Text>
      </Box>
    );
  }

  // If stack is empty (shouldn't happen), show loading state
  if (!current) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          gitmag
        </Text>
        <Text color="gray" dimColor>
          Loading repository...
        </Text>
      </Box>
    );
  }

  if (current.name === 'commit') {
    return (
      <CommitScreen
        repo={current.repo}
        initialSelectedCommitIdx={selectedCommitIdx}
        initialSelectedFileIdx={selectedFileIdx}
        onBack={() => {
          pop();
          setSelectedCommitIdx(0);
          setSelectedFileIdx(0);
        }}
        workingChanges={workingChanges}
        onOpenDiff={(commit, file, fileIdx, commitIdx) => {
          if (repository) {
            const getDiff = () => repository.getDiff(commit.hash, file.path);
            push({
              name: 'diff',
              repo: current.repo,
              commit,
              file,
              getDiff,
              selectedFileIdx: fileIdx,
              selectedCommitIdx: commitIdx,
            });
            setSelectedFileIdx(fileIdx);
            setSelectedCommitIdx(commitIdx);
          }
        }}
      />
    );
  }

  if (current.name === 'diff') {
    return (
      <FileDiffScreen
        repo={current.repo}
        commit={current.commit}
        file={current.file}
        getDiff={current.getDiff}
        onBack={() => {
          pop();
          setSelectedFileIdx(current.selectedFileIdx);
          setSelectedCommitIdx(current.selectedCommitIdx);
        }}
      />
    );
  }

  // Fallback — should never reach here
  return null;
}
