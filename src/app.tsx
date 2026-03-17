import { useState } from 'react';
import { Box, Text } from 'ink';
import { SplashScreen } from './components/SplashScreen.js';
import { RepoScreen } from './components/RepoScreen.js';
import { CommitScreen } from './components/CommitScreen.js';
import { FileDiffScreen } from './components/FileDiffScreen.js';
import { useScanner } from './components/Scanner.js';
import { useAppInput } from './hooks/useAppInput.js';
import { useRepository } from './hooks/useRepository.js';
import type { RepoEntry, CommitEntry, ChangedFile } from './data/mockRepos.js';

export type Route =
  | { name: 'repo' }
  | { name: 'commit'; repoPath: string; repo: RepoEntry }
  | {
      name: 'diff';
      repo: RepoEntry;
      commit: CommitEntry;
      file: ChangedFile;
      getDiff: () => Promise<string>;
    };

export function App() {
  const [screen, setScreen] = useState<'splash' | 'router'>('splash');
  const [stack, setStack] = useState<Route[]>([{ name: 'repo' }]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const scanProgress = useScanner();
  const { repos, loading: repoLoading, error: repoError } = useRepository(process.cwd());

  const push = (route: Route) => setStack((prev) => [...prev, route]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const current = stack[stack.length - 1]!;

  // Centralized input handler for navigation, selection, and quit
  // This hook is ALWAYS called, but only active when screen === 'router'
  // On the commit and diff screens, they own their own input — disable global nav.
  const isCommitOrDiffScreen = current.name === 'commit' || current.name === 'diff';
  useAppInput({
    screen,
    onUp: isCommitOrDiffScreen ? undefined : () => setSelectedIdx((prev) => Math.max(prev - 1, 0)),
    onDown: isCommitOrDiffScreen
      ? undefined
      : () =>
          setSelectedIdx((prev) => {
            // Dynamic max based on current screen
            if (current.name === 'repo') {
              return Math.min(prev + 1, repos.length - 1);
            }
            return prev;
          }),
    onSelect: () => {
      if (current.name === 'repo') {
        const selectedRepo = repos[selectedIdx];
        if (selectedRepo) {
          push({ name: 'commit', repoPath: selectedRepo.path, repo: selectedRepo });
          setSelectedIdx(0); // Reset selection for next screen
        }
      }
    },
    onBack: isCommitOrDiffScreen
      ? undefined
      : () => {
          pop();
          setSelectedIdx(0); // Reset selection when going back
        },
  });

  if (screen === 'splash') {
    return (
      <SplashScreen
        onComplete={() => {
          // Clear terminal and transition to router screen
          if (process.stdout.isTTY) {
            process.stdout.write('\u001B[2J\u001B[0f');
          }
          setScreen('router');
        }}
        scanProgress={scanProgress}
      />
    );
  }

  if (current.name === 'repo') {
    // Show loading state
    if (repoLoading) {
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

    // Show error state
    if (repoError) {
      return (
        <Box flexDirection="column" padding={1}>
          <Text color="cyan" bold>
            gitmag
          </Text>
          <Text color="red">{repoError}</Text>
        </Box>
      );
    }

    // Show empty state
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

    return <RepoScreen repos={repos} selectedIdx={selectedIdx} scanProgress={scanProgress} />;
  }

  if (current.name === 'commit') {
    return (
      <CommitScreen
        repo={current.repo}
        initialSelectedIdx={selectedIdx}
        onBack={() => {
          pop();
          setSelectedIdx(0);
        }}
        onOpenDiff={(commit, file) => {
          const repository = repos.find((r) => r.path === current.repo.path);
          if (repository) {
            const getDiff = async () => {
              // Lazy-load the diff when FileDiffScreen mounts
              // In a real implementation, this would call Repository.getDiff
              // For now, return the pre-populated diff if available
              return file.diff || '';
            };
            push({ name: 'diff', repo: current.repo, commit, file, getDiff });
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
        }}
      />
    );
  }

  // Fallback — should never reach here
  return null;
}
