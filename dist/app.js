import { jsx as _jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { Box, Text } from 'ink';
import { SplashScreen } from './components/SplashScreen.js';
import { useScanner } from './Scanner.js';
export function App() {
  const [screen, setScreen] = useState('splash');
  const scanProgress = useScanner();
  if (screen === 'splash') {
    return _jsx(SplashScreen, { onComplete: () => setScreen('ready'), scanProgress: scanProgress });
  }
  // Stub — future screens will be wired here
  return _jsx(Box, { padding: 2, children: _jsx(Text, { color: 'cyan', children: 'Ready.' }) });
}
//# sourceMappingURL=app.js.map
