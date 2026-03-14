import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen.js';
import { RepoScreen } from './components/RepoScreen.js';
import { CommitScreen } from './components/CommitScreen.js';
import { useScanner } from './components/Scanner.js';
import { useAppInput } from './hooks/useAppInput.js';
import { MOCK_REPOS } from './data/mockRepos.js';
import type { RepoEntry } from './data/mockRepos.js';

export type Route = { name: 'repo' } | { name: 'commit'; repoPath: string; repo: RepoEntry };

export function App() {
  const [screen, setScreen] = useState<'splash' | 'router'>('splash');
  const [stack, setStack] = useState<Route[]>([{ name: 'repo' }]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const scanProgress = useScanner();

  const push = (route: Route) => setStack((prev) => [...prev, route]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const current = stack[stack.length - 1]!;

  // Centralized input handler for navigation, selection, and quit
  // This hook is ALWAYS called, but only active when screen === 'router'
  useAppInput({
    screen,
    onUp: () => setSelectedIdx((prev) => Math.max(prev - 1, 0)),
    onDown: () =>
      setSelectedIdx((prev) => {
        // Dynamic max based on current screen
        if (current.name === 'repo') {
          return Math.min(prev + 1, MOCK_REPOS.length - 1);
        }
        if (current.name === 'commit') {
          return Math.min(prev + 1, current.repo.commits.length - 1);
        }
        return prev;
      }),
    onSelect: () => {
      if (current.name === 'repo') {
        const selectedRepo = MOCK_REPOS[selectedIdx];
        if (selectedRepo) {
          push({ name: 'commit', repoPath: selectedRepo.path, repo: selectedRepo });
          setSelectedIdx(0); // Reset selection for next screen
        }
      }
    },
    onBack: () => {
      pop();
      setSelectedIdx(0); // Reset selection when going back
    },
  });

  if (screen === 'splash') {
    return <SplashScreen onComplete={() => setScreen('router')} scanProgress={scanProgress} />;
  }

  if (current.name === 'repo') {
    return <RepoScreen selectedIdx={selectedIdx} scanProgress={scanProgress} />;
  }

  if (current.name === 'commit') {
    return <CommitScreen repo={current.repo} />;
  }

  // Fallback — should never reach here
  return null;
}
