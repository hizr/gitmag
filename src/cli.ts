import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import {
  createTerminalController,
  selectRenderTarget,
  type TerminalStream,
} from './utils/terminal.js';
import { closeSync, openSync } from 'node:fs';
import { WriteStream as TtyWriteStream } from 'node:tty';

/**
 * When stdout is a TTY (interactive terminal), render the TUI there.
 * When stdout is piped (e.g., in $(gitmag)), render to stderr so the TUI
 * appears on the terminal but doesn't pollute the captured stdout.
 * This allows gitmag to be used in shell command substitution.
 */
const makeTtyFallback = (): { stream: TerminalStream | null; fd: number | null } => {
  if (process.stdout.isTTY || process.stderr.isTTY) {
    return { stream: null, fd: null };
  }

  try {
    const fd = openSync('/dev/tty', 'w');
    return { stream: new TtyWriteStream(fd), fd };
  } catch {
    return { stream: null, fd: null };
  }
};

const { stream: ttyFallbackStream, fd: ttyFallbackFd } = makeTtyFallback();
const renderTarget = selectRenderTarget(
  process.stdout,
  process.stderr,
  ttyFallbackStream
) as TtyWriteStream;
const terminal = createTerminalController(
  renderTarget,
  process.stdout.isTTY || process.stderr.isTTY || Boolean(renderTarget.isTTY)
);

const originalProcessExit = process.exit.bind(process);
process.exit = ((code?: number | string | null | undefined): never => {
  terminal.restore();
  const normalizedCode = typeof code === 'number' ? code : 0;
  return originalProcessExit(normalizedCode);
}) as typeof process.exit;

/** Commit hash picked by the user via the 'p' key, to be emitted after exit. */
let pickedHash: string | null = null;

// Enter fullscreen alternative screen buffer and hide cursor
terminal.enter();

const { waitUntilExit } = render(
  React.createElement(App, {
    onPickCommit: (hash: string) => {
      pickedHash = hash;
    },
  }),
  { stdout: renderTarget }
);

// Final safety net: restore terminal even on abrupt process exit paths.
process.on('exit', () => {
  terminal.restore();
  if (ttyFallbackFd !== null) {
    closeSync(ttyFallbackFd);
  }
});

process.on('uncaughtException', () => {
  terminal.restore();
});

process.on('unhandledRejection', () => {
  terminal.restore();
});

// Restore terminal on clean exit
waitUntilExit()
  .then(() => {
    terminal.restore();
    if (pickedHash !== null) {
      process.stdout.write(pickedHash + '\n');
    }
  })
  .catch(() => {
    terminal.restore();
    process.exit(1);
  });

// Restore terminal on SIGTERM / SIGINT
process.on('SIGTERM', () => {
  terminal.restore();
  process.exit(0);
});

process.on('SIGINT', () => {
  terminal.restore();
  process.exit(0);
});
