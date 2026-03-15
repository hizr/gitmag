export interface CommitEntry {
  hash: string;
  message: string;
  date: string;
}

export interface RepoEntry {
  path: string;
  commits: CommitEntry[];
}

export const MOCK_REPOS: RepoEntry[] = [
  {
    path: '~/dev/gitmag',
    commits: [
      { hash: '92f2ae8', message: 'feat: implement full terminal centering', date: '2026-03-14' },
      {
        hash: '37108a1',
        message: 'fix: simplify splash screen layout padding',
        date: '2026-03-14',
      },
      {
        hash: '2cafbb1',
        message: 'feat: center splash screen animation in terminal',
        date: '2026-03-14',
      },
    ],
  },
  {
    path: '~/dev/my-project',
    commits: [
      { hash: 'abc1234', message: 'feat: add login page component', date: '2026-03-12' },
      {
        hash: 'def5678',
        message: 'fix: null pointer exception in auth service',
        date: '2026-03-11',
      },
    ],
  },
  {
    path: '~/dev/api-server',
    commits: [
      { hash: 'aaa9999', message: 'chore: update dependencies', date: '2026-03-10' },
      { hash: 'bbb0000', message: 'refactor: extract database utilities', date: '2026-03-09' },
      {
        hash: 'ccc1111',
        message: 'test: add integration tests for payment endpoint',
        date: '2026-03-08',
      },
    ],
  },
];
