import { useState } from 'react';
import { Box, Text } from 'ink';
import { SplashScreen } from './components/SplashScreen.js';
import { useScanner } from './components/Scanner.js';

type Screen = 'splash' | 'ready';

export function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const scanProgress = useScanner();

  if (screen === 'splash') {
    return <SplashScreen onComplete={() => setScreen('ready')} scanProgress={scanProgress} />;
  }

  // Stub — future screens will be wired here
  return (
    <Box padding={2}>
      <Text color="cyan">Ready.</Text>
    </Box>
  );
}
