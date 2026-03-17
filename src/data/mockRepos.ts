export type FileStatus = 'M' | 'A' | 'D' | 'R';

export interface ChangedFile {
  status: FileStatus;
  path: string;
  diff?: string;
}

export interface CommitEntry {
  hash: string;
  message: string;
  date: string;
  author: string;
  body: string;
  parentHash: string[];
  branchName?: string;
  changedFiles: ChangedFile[];
}

export interface RepoEntry {
  path: string;
  commits: CommitEntry[];
}
