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

export const MOCK_REPOS: RepoEntry[] = [
  {
    path: '~/dev/gitmag',
    commits: [
      {
        hash: '92f2ae8',
        message: 'feat: implement full terminal centering',
        date: '2026-03-14',
        author: 'Alice Müller',
        body: 'Use useStdout to obtain real terminal dimensions and center\nall panels using Ink flexbox justify/align properties.\n\nCloses #42',
        parentHash: ['37108a1'],
        branchName: 'main',
        changedFiles: [
          {
            status: 'M',
            path: 'src/components/SplashScreen.tsx',
            diff: `--- a/src/components/SplashScreen.tsx
+++ b/src/components/SplashScreen.tsx
@@ -10,7 +10,8 @@
 export function SplashScreen({ onComplete, scanProgress }: SplashScreenProps) {
   const { stdout } = useStdout();
-  const termCols = stdout.columns ?? 80;
-  const termRows = stdout.rows ?? 24;
+  const termCols = Math.max(stdout.columns ?? 80, 80);
+  const termRows = Math.max(stdout.rows ?? 24, 24);
+  // Use real terminal dimensions for proper centering
   
   // Render the splash screen centered
   return (
`,
          },
          {
            status: 'M',
            path: 'src/components/CommitScreen.tsx',
            diff: `--- a/src/components/CommitScreen.tsx
+++ b/src/components/CommitScreen.tsx
@@ -105,9 +105,12 @@
 export function CommitScreen({ repo, initialSelectedIdx = 0, onBack }: CommitScreenProps) {
   const { stdout } = useStdout();
-  const termCols = stdout.columns ?? 80;
-  const termRows = stdout.rows ?? 24;
+  const termCols = Math.max(stdout.columns ?? 80, 80);
+  const termRows = Math.max(stdout.rows ?? 24, 24);
 
   const graphLines = buildGraphLines(repo.commits);
+
+  // Layout dimensions now use real terminal size
   
   // ── State ────────────────────────────────────────────────────────────
   const [focus, setFocus] = useState<FocusPanel>('graph');
`,
          },
          {
            status: 'A',
            path: 'src/hooks/useTerminalSize.ts',
            diff: `--- /dev/null
+++ b/src/hooks/useTerminalSize.ts
@@ -0,0 +1,15 @@
+import { useStdout } from 'ink';
+
+export interface TerminalSize {
+  cols: number;
+  rows: number;
+}
+
+export function useTerminalSize(): TerminalSize {
+  const { stdout } = useStdout();
+  return {
+    cols: Math.max(stdout.columns ?? 80, 80),
+    rows: Math.max(stdout.rows ?? 24, 24),
+  };
+}
`,
          },
        ],
      },
      {
        hash: '37108a1',
        message: 'fix: simplify splash screen layout padding',
        date: '2026-03-14',
        author: 'Bob Schneider',
        body: 'Remove redundant paddingX on inner boxes; outer container\nalready provides the correct gutter.',
        parentHash: ['a1b2c3d'],
        changedFiles: [{ status: 'M', path: 'src/components/SplashScreen.tsx' }],
      },
      {
        hash: 'a1b2c3d',
        message: 'feat: add feature-x implementation',
        date: '2026-03-13',
        author: 'Alice Müller',
        body: 'Implement feature-x with full test coverage.\nSee RFC-17 for design rationale.',
        parentHash: ['2cafbb1', 'e4f5a6b'],
        changedFiles: [
          { status: 'A', path: 'src/features/feature-x.ts' },
          { status: 'A', path: 'tests/features/feature-x.test.ts' },
        ],
      },
      {
        hash: 'e4f5a6b',
        message: 'feat: branch work on feature-x helper',
        date: '2026-03-13',
        author: 'Carol Dubois',
        body: 'Extract helper utilities for feature-x into a separate module.',
        parentHash: ['2cafbb1'],
        branchName: 'feature/feature-x',
        changedFiles: [
          { status: 'A', path: 'src/features/feature-x-helpers.ts' },
          { status: 'M', path: 'src/app.tsx' },
        ],
      },
      {
        hash: '2cafbb1',
        message: 'feat: center splash screen animation in terminal',
        date: '2026-03-14',
        author: 'Alice Müller',
        body: 'Initial implementation of centered splash screen using\nflexbox alignment in Ink.',
        parentHash: [],
        changedFiles: [
          { status: 'A', path: 'src/components/SplashScreen.tsx' },
          { status: 'A', path: 'src/app.tsx' },
          { status: 'A', path: 'src/cli.ts' },
          { status: 'A', path: 'src/index.ts' },
        ],
      },
    ],
  },
  {
    path: '~/dev/my-project',
    commits: [
      {
        hash: 'abc1234',
        message: 'feat: add login page component',
        date: '2026-03-12',
        author: 'Bob Schneider',
        body: 'Add LoginPage component with form validation and\nerror handling. Integrates with the auth service.',
        parentHash: ['def5678'],
        branchName: 'main',
        changedFiles: [
          {
            status: 'A',
            path: 'src/pages/LoginPage.tsx',
            diff: `--- /dev/null
+++ b/src/pages/LoginPage.tsx
@@ -0,0 +1,45 @@
+import React, { useState } from 'react';
+
+interface LoginFormState {
+  email: string;
+  password: string;
+  error?: string;
+}
+
+export function LoginPage() {
+  const [form, setForm] = useState<LoginFormState>({
+    email: '',
+    password: '',
+  });
+
+  const handleSubmit = async (e: React.FormEvent) => {
+    e.preventDefault();
+    try {
+      const response = await fetch('/api/auth/login', {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify(form),
+      });
+      if (!response.ok) {
+        throw new Error('Login failed');
+      }
+      // Redirect to dashboard
+      window.location.href = '/dashboard';
+    } catch (err) {
+      setForm(prev => ({
+        ...prev,
+        error: (err as Error).message,
+      }));
+    }
+  };
+
+  return (
+    <form onSubmit={handleSubmit}>
+      <input
+        type="email"
+        placeholder="Email"
+        value={form.email}
+        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
+      />
+    </form>
+  );
+}
`,
          },
          { status: 'M', path: 'src/router.tsx' },
          { status: 'A', path: 'tests/pages/LoginPage.test.tsx' },
        ],
      },
      {
        hash: 'def5678',
        message: 'fix: null pointer exception in auth service',
        date: '2026-03-11',
        author: 'Carol Dubois',
        body: 'Guard against undefined user object when session expires\nbefore the auth check completes.',
        parentHash: [],
        changedFiles: [
          { status: 'M', path: 'src/services/auth.ts' },
          { status: 'M', path: 'tests/services/auth.test.ts' },
        ],
      },
    ],
  },
  {
    path: '~/dev/api-server',
    commits: [
      {
        hash: 'aaa9999',
        message: 'chore: update dependencies',
        date: '2026-03-10',
        author: 'Alice Müller',
        body: 'Bump all dependencies to latest patch versions.\nNo breaking changes.',
        parentHash: ['bbb0000'],
        branchName: 'main',
        changedFiles: [
          { status: 'M', path: 'package.json' },
          { status: 'M', path: 'package-lock.json' },
        ],
      },
      {
        hash: 'bbb0000',
        message: 'refactor: extract database utilities',
        date: '2026-03-09',
        author: 'Bob Schneider',
        body: 'Move all raw DB query helpers into src/db/utils.ts so\nthey can be reused across multiple route handlers.',
        parentHash: ['ccc1111'],
        changedFiles: [
          { status: 'A', path: 'src/db/utils.ts' },
          { status: 'M', path: 'src/routes/users.ts' },
          { status: 'M', path: 'src/routes/orders.ts' },
          { status: 'D', path: 'src/helpers/db-legacy.ts' },
        ],
      },
      {
        hash: 'ccc1111',
        message: 'test: add integration tests for payment endpoint',
        date: '2026-03-08',
        author: 'Carol Dubois',
        body: 'Cover the full payment flow with integration tests:\ncreate order → initiate payment → webhook callback.',
        parentHash: [],
        changedFiles: [
          { status: 'A', path: 'tests/integration/payment.test.ts' },
          { status: 'M', path: 'src/routes/payment.ts' },
        ],
      },
    ],
  },
];
