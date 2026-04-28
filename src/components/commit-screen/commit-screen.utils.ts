import type { CommitEntry, WorkingChanges } from '../../data/mockRepos.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FileLine = {
  status: string;
  path: string;
  isHeader?: boolean;
  stagingState?: 'staged' | 'unstaged' | 'untracked';
};

export type InfoLine = { label: string; value: string; wrap?: boolean };

// ── Clipboard helpers ─────────────────────────────────────────────────────────

export function handleClipboardSuccess(
  hash: string,
  setCopyStatus: (msg: string | null) => void
): void {
  setCopyStatus(`Copied ${hash} to clipboard`);
  setTimeout(() => setCopyStatus(null), 1500);
}

export function handleClipboardError(setCopyStatus: (msg: string | null) => void): void {
  setCopyStatus('Clipboard unavailable — install wl-clipboard');
  setTimeout(() => setCopyStatus(null), 1500);
}

export function handleModuleError(setCopyStatus: (msg: string | null) => void): void {
  setCopyStatus('Clipboard module unavailable');
  setTimeout(() => setCopyStatus(null), 1500);
}

// ── File and info builders ────────────────────────────────────────────────────

export function buildFileLines(commit: CommitEntry, workingChanges?: WorkingChanges): FileLine[] {
  if (commit.hash !== '__WORKING__') {
    return commit.changedFiles.map((f) => ({ status: f.status, path: f.path }));
  }

  // For __WORKING__ commit, use the segregated WorkingChanges if provided
  if (workingChanges) {
    const lines: FileLine[] = [];

    if (workingChanges.staged.length > 0) {
      lines.push({ status: '📦', path: 'Staged', isHeader: true });
      lines.push(
        ...workingChanges.staged.map((f) => ({
          status: f.status,
          path: f.path,
          stagingState: 'staged' as const,
        }))
      );
    }
    if (workingChanges.unstaged.length > 0) {
      lines.push({ status: '✎', path: 'Unstaged', isHeader: true });
      lines.push(
        ...workingChanges.unstaged.map((f) => ({
          status: f.status,
          path: f.path,
          stagingState: 'unstaged' as const,
        }))
      );
    }
    if (workingChanges.untracked.length > 0) {
      lines.push({ status: '?', path: 'Untracked', isHeader: true });
      lines.push(
        ...workingChanges.untracked.map((f) => ({
          status: f.status,
          path: f.path,
          stagingState: 'untracked' as const,
        }))
      );
    }
    return lines;
  }

  // Fallback if workingChanges is not provided (shouldn't happen in normal flow)
  const lines: FileLine[] = [];
  const staged = commit.changedFiles.filter(
    (f) => f.status !== 'M' && f.status !== 'D' && f.status !== '??'
  );
  const unstaged = commit.changedFiles.filter((f) => f.status === 'M' || f.status === 'D');
  const untracked = commit.changedFiles.filter((f) => f.status === '??');

  if (staged.length > 0) {
    lines.push({ status: '📦', path: 'Staged', isHeader: true });
    lines.push(
      ...staged.map((f) => ({ status: f.status, path: f.path, stagingState: 'staged' as const }))
    );
  }
  if (unstaged.length > 0) {
    lines.push({ status: '✎', path: 'Unstaged', isHeader: true });
    lines.push(
      ...unstaged.map((f) => ({
        status: f.status,
        path: f.path,
        stagingState: 'unstaged' as const,
      }))
    );
  }
  if (untracked.length > 0) {
    lines.push({ status: '?', path: 'Untracked', isHeader: true });
    lines.push(
      ...untracked.map((f) => ({
        status: f.status,
        path: f.path,
        stagingState: 'untracked' as const,
      }))
    );
  }
  return lines;
}

export function buildInfoLines(
  commit: CommitEntry,
  workingChanges?: WorkingChanges
): {
  infoLines: InfoLine[];
  bodyLines: string[];
} {
  if (commit.hash === '__WORKING__') {
    // Use segregated WorkingChanges if provided, otherwise infer from changedFiles
    let staged = commit.changedFiles.filter(
      (f) => f.status !== 'M' && f.status !== 'D' && f.status !== '??'
    );
    let unstaged = commit.changedFiles.filter((f) => f.status === 'M' || f.status === 'D');
    let untracked = commit.changedFiles.filter((f) => f.status === '??');

    if (workingChanges) {
      staged = workingChanges.staged;
      unstaged = workingChanges.unstaged;
      untracked = workingChanges.untracked;
    }

    return {
      infoLines: [
        { label: 'Status ', value: 'Working directory changes' },
        { label: 'Staged ', value: `${staged.length} file(s)` },
        { label: 'Unstaged', value: `${unstaged.length} file(s)` },
        { label: 'Untracked', value: `${untracked.length} file(s)` },
      ],
      bodyLines: [],
    };
  }

  return {
    infoLines: [
      { label: 'Hash  ', value: commit.hash },
      { label: 'Author', value: commit.author },
      { label: 'Date  ', value: commit.date },
      { label: 'Refs  ', value: commit.refs.length > 0 ? commit.refs.join(', ') : '—' },
      { label: 'Message', value: commit.message, wrap: true },
    ],
    bodyLines: commit.body ? ['', ...commit.body.split('\n')] : [],
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const FILE_STATUS_COLOR: Record<string, string> = {
  A: 'green',
  M: 'yellow',
  D: 'red',
  R: 'cyan',
};
