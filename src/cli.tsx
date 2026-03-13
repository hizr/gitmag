#!/usr/bin/env node
import { Command } from 'commander';
import { render } from 'ink';
import { App } from './app.js';
import { printSchema } from './output/schema.js';
import { printJsonOutput } from './output/json-output.js';
import { findRepos } from './scanner/find-repos.js';
import { getRepoActivity } from './scanner/repo-activity.js';
import { recordRun, getWindowStart, resetState } from './state/config.js';
import type { AppConfig } from './types/index.js';

const program = new Command();

program
  .name('gitmag')
  .description('A terminal-based Git activity digest across local repositories.')
  .version('0.1.0')
  .option('--depth <number>', 'directory scan depth', '3')
  .option('--json', 'output results as JSON instead of TUI')
  .option('--since <duration>', 'time window to show (e.g. 1h, 24h, 7d, 2w)')
  .option('--all', 'include repos with no activity in the time window')
  .option('--schema', 'print the OpenAPI 3.x JSON schema for --json output')
  .option('--yaml', 'with --schema, output schema as YAML instead of JSON')
  .option('--reset', 'clear all saved state and start fresh')
  .parse(process.argv);

const opts = program.opts();

const config: AppConfig = {
  depth: parseInt(opts['depth'] as string, 10),
  json: Boolean(opts['json']),
  since: opts['since'] as string | undefined,
  all: Boolean(opts['all']),
  schema: Boolean(opts['schema']),
  yaml: Boolean(opts['yaml']),
  reset: Boolean(opts['reset']),
};

// --schema: print OpenAPI schema and exit (no TUI, no scan)
if (config.schema) {
  printSchema(config.yaml);
  process.exit(0);
}

// --json: run the scanner non-interactively, print JSON, and exit
if (config.json) {
  (async () => {
    if (config.reset) resetState();

    const now = new Date();
    const windowStart = getWindowStart(config.since);
    recordRun();

    const { repoPaths } = await findRepos(process.cwd(), config.depth);
    const repos = [];

    for (const repoPath of repoPaths) {
      const repo = await getRepoActivity(repoPath, windowStart);
      if (repo.totalCommits > 0 || config.all) {
        repos.push(repo);
      }
    }

    printJsonOutput(repos, process.cwd(), windowStart, now);
    process.exit(0);
  })().catch((err: unknown) => {
    process.stderr.write(`gitmag error: ${String(err)}\n`);
    process.exit(1);
  });
} else {
  // Default: interactive TUI
  render(<App config={config} />, {
    stdin: process.stdin,
    exitOnCtrlC: true,
  });
}
