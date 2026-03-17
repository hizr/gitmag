export type FileStatus = 'M' | 'A' | 'D' | 'R' | '??';

export interface ChangedFile {
  status: FileStatus;
  path: string;
  diff?: string;
}

export interface WorkingChanges {
  staged: ChangedFile[];
  unstaged: ChangedFile[];
  untracked: ChangedFile[];
}

export interface BranchInfo {
  currentBranch: string;
  remoteBranch: string | null;
  ahead: number;
  behind: number;
  headAuthor: string;
  repoPath: string;
}

export interface CommitEntry {
  hash: string;
  message: string;
  date: string;
  author: string;
  body: string;
  parentHash: string[];
  refs: string[];
  changedFiles: ChangedFile[];
}

export interface RepoEntry {
  path: string;
  commits: CommitEntry[];
  branchInfo?: BranchInfo;
}
