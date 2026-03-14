import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen.js';
import { RepoScreen } from './components/RepoScreen.js';
import { CommitScreen } from './components/CommitScreen.js';
import { useScanner } from './components/Scanner.js';
import { useQuit } from './hooks/useQuit.js';
import type { RepoEntry } from './data/mockRepos.js';

type Route = { name: 'repo' } | { name: 'commit'; repoPath: string; repo: RepoEntry };

export function App() {
  const [screen, setScreen] = useState<'splash' | 'router'>('splash');
  const [stack, setStack] = useState<Route[]>([{ name: 'repo' }]);
  const scanProgress = useScanner();

  // Quit hook is only active when not on splash
  if (screen === 'router') {
    useQuit();
  }

  const push = (route: Route) => setStack((prev) => [...prev, route]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  if (screen === 'splash') {
    return <SplashScreen onComplete={() => setScreen('router')} scanProgress={scanProgress} />;
  }

  const current = stack[stack.length - 1]!;

  if (current.name === 'repo') {
    return (
      <RepoScreen
        scanProgress={scanProgress}
        onSelect={(repo) => push({ name: 'commit', repoPath: repo.path, repo })}
        onBack={() => pop()}
      />
    );
  }

  if (current.name === 'commit') {
    return <CommitScreen repo={current.repo} onBack={() => pop()} />;
  }

  // Fallback — should never reach here
  return null;
}
