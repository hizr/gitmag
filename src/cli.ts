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

/**
 * When stdout is a TTY (interactive terminal), render the TUI there.
 * When stdout is piped (e.g., in $(gitmag)), render to stderr so the TUI
 * appears on the terminal but doesn't pollute the captured stdout.
 * This allows gitmag to be used in shell command substitution.
 */
const renderTarget = isTTY ? process.stdout : process.stderr;

/** Commit hash picked by the user via the 'p' key, to be emitted after exit. */
let pickedHash: string | null = null;

/** Restore the terminal to its prior state before exiting. */
function restoreTerminal(): void {
  if (isTTY) {
    renderTarget.write(cursorShow);
    renderTarget.write(exitAlternativeScreen);
  }
}

// Enter fullscreen alternative screen buffer and hide cursor
if (isTTY) {
  renderTarget.write(enterAlternativeScreen);
  renderTarget.write(cursorHide);
}

const { waitUntilExit } = render(
  React.createElement(App, {
    onPickCommit: (hash: string) => {
      pickedHash = hash;
    },
  }),
  { stdout: renderTarget }
);

// Restore terminal on clean exit
waitUntilExit()
  .then(() => {
    restoreTerminal();
    if (pickedHash !== null) {
      process.stdout.write(pickedHash + '\n');
    }
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
