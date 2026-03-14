import { useState } from 'react';
import { Box, Text } from 'ink';
import { SplashScreen } from './components/SplashScreen.js';

type Screen = 'splash' | 'ready';

export function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  if (screen === 'splash') {
    return <SplashScreen onComplete={() => setScreen('ready')} />;
  }

  // Stub — future screens will be wired here
  return (
    <Box padding={2}>
      <Text color="cyan">Ready.</Text>
    </Box>
  );
}
