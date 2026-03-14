import { jsx as _jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { Box, Text } from 'ink';
import { SplashScreen } from './components/SplashScreen.js';
export function App() {
  const [screen, setScreen] = useState('splash');
  if (screen === 'splash') {
    return _jsx(SplashScreen, { onComplete: () => setScreen('ready') });
  }
  // Stub — future screens will be wired here
  return _jsx(Box, { padding: 2, children: _jsx(Text, { color: 'cyan', children: 'Ready.' }) });
}
//# sourceMappingURL=app.js.map
