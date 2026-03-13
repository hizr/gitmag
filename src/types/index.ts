// Shared TypeScript interfaces for gitmag

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  binary: boolean;
}

export interface Commit {
  hash: string;
  message: string;
  date: string;
  files: FileChange[];
}

export interface Author {
  name: string;
  email: string;
  commits: Commit[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface Repository {
  path: string;
  name: string;
  authors: Author[];
  totalCommits: number;
}

export interface TimeWindow {
  from: Date;
  to: Date;
}

export interface AppConfig {
  depth: number;
  json: boolean;
  since: string | undefined;
  all: boolean;
  schema: boolean;
  yaml: boolean;
  reset: boolean;
}

export interface GitmapState {
  lastRun: string | null;
  repos: Record<string, { lastSeenCommit: string }>;
}

// Scanner progress event types
export type ScanEvent =
  | { type: 'found'; repoPath: string; repoName: string }
  | { type: 'fetching'; repoPath: string; repoName: string }
  | {
      type: 'fetched';
      repoPath: string;
      repoName: string;
      commitCount: number;
      authorCount: number;
    }
  | { type: 'error'; repoPath: string; repoName: string; message: string }
  | { type: 'done'; totalDirs: number; totalRepos: number; activeRepos: number };
