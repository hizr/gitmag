import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen.js';
import { RepoScreen } from './components/RepoScreen.js';
import { useScanner } from './components/Scanner.js';

type Screen = 'splash' | 'repo';

export function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const scanProgress = useScanner();

  if (screen === 'splash') {
    return <SplashScreen onComplete={() => setScreen('repo')} scanProgress={scanProgress} />;
  }

  return <RepoScreen scanProgress={scanProgress} />;
}
