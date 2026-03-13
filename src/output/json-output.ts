import type { Repository } from '../types/index.js';

export interface JsonOutput {
  scanDirectory: string;
  timeWindow: { from: string; to: string };
  repositories: JsonRepository[];
}

export interface JsonRepository {
  path: string;
  name: string;
  authors: JsonAuthor[];
}

export interface JsonAuthor {
  name: string;
  email: string;
  commits: JsonCommit[];
}

export interface JsonCommit {
  hash: string;
  message: string;
  date: string;
  files: JsonFileChange[];
}

export interface JsonFileChange {
  path: string;
  additions: number;
  deletions: number;
  binary: boolean;
}

/**
 * Transforms scanned Repository[] into the JSON output structure
 * and prints it to stdout.
 */
export function printJsonOutput(
  repos: Repository[],
  scanDirectory: string,
  windowStart: Date,
  windowEnd: Date
): void {
  const output: JsonOutput = {
    scanDirectory,
    timeWindow: {
      from: windowStart.toISOString(),
      to: windowEnd.toISOString(),
    },
    repositories: repos.map((repo) => ({
      path: repo.path,
      name: repo.name,
      authors: repo.authors.map((author) => ({
        name: author.name,
        email: author.email,
        commits: author.commits.map((commit) => ({
          hash: commit.hash,
          message: commit.message,
          date: commit.date,
          files: commit.files.map((file) => ({
            path: file.path,
            additions: file.additions,
            deletions: file.deletions,
            binary: file.binary,
          })),
        })),
      })),
    })),
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}
