import React from 'react';
import { render } from 'ink';
import {
  enterAlternativeScreen,
  exitAlternativeScreen,
  cursorHide,
  cursorShow,
} from 'ansi-escapes';
import { App } from './app.js';
const isTTY = Boolean(process.stdout.isTTY);
/** Restore the terminal to its prior state before exiting. */
function restoreTerminal() {
  if (isTTY) {
    process.stdout.write(cursorShow);
    process.stdout.write(exitAlternativeScreen);
  }
}
// Enter fullscreen alternative screen buffer and hide cursor
if (isTTY) {
  process.stdout.write(enterAlternativeScreen);
  process.stdout.write(cursorHide);
}
const { waitUntilExit } = render(React.createElement(App));
// Restore terminal on clean exit
waitUntilExit()
  .then(() => {
    restoreTerminal();
  })
  .catch(() => {
    restoreTerminal();
    process.exit(1);
  });
// Restore terminal on SIGTERM / SIGINT
process.on('SIGTERM', () => {
  restoreTerminal();
  process.exit(0);
});
process.on('SIGINT', () => {
  restoreTerminal();
  process.exit(0);
});
//# sourceMappingURL=cli.js.map
