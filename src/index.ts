#!/usr/bin/env node

// When stdout is piped (e.g., in $(gitmag)), force chalk to emit ANSI colors.
// The TUI renders to stderr (a real TTY) so colors are valid.
// This must be set before chalk/ink imports are evaluated.
if (!process.stdout.isTTY) {
  process.env['FORCE_COLOR'] = '3';
}

await import('./cli.js');
