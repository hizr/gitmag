import { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdin } from 'ink';
import { ScanLog } from './components/scan-log.js';
import { Header } from './components/header.js';
import { Breadcrumb } from './components/breadcrumb.js';
import { RepoList } from './components/repo-list.js';
import { AuthorList } from './components/author-list.js';
import { CommitList } from './components/commit-list.js';
import { DiffView } from './components/diff-view.js';
import { findRepos } from './scanner/find-repos.js';
import { getRepoActivity, getFileDiff } from './scanner/repo-activity.js';
import { recordRun, getWindowStart, resetState } from './state/config.js';
import { formatTimeWindow } from './utils/time.js';
import type {
  AppConfig,
  ScanEvent,
  Repository,
  Author,
  Commit,
  FileChange,
} from './types/index.js';

type Screen = 'scanning' | 'repos' | 'authors' | 'commits' | 'diff';

interface AppProps {
  config: AppConfig;
}

/** Handles top-level keyboard shortcuts — only mounted when raw mode is available. */
function KeyboardHandler({ screen, onBack }: { screen: Screen; onBack: () => void }) {
  const { exit } = useApp();
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      if (screen === 'repos') {
        exit();
      } else {
        onBack();
      }
    }
  });
  return null;
}

export function App({ config }: AppProps) {
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();

  const [screen, setScreen] = useState<Screen>('scanning');
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [isScanComplete, setIsScanComplete] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [windowLabel, setWindowLabel] = useState('last 24h');

  // Drill-down selection state
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);
  const [rawDiff, setRawDiff] = useState<string>('');

  // Kick off the scanner on mount
  useEffect(() => {
    if (config.reset) {
      resetState();
    }

    const now = new Date();
    const windowStart = getWindowStart(config.since);
    const windowEnd = now;
    setWindowLabel(formatTimeWindow(windowStart, windowEnd));
    recordRun();

    let totalDirs = 0;

    const run = async () => {
      const { repoPaths, totalDirsScanned } = await findRepos(
        process.cwd(),
        config.depth,
        (repoPath, repoName) => {
          setScanEvents((prev) => [...prev, { type: 'found', repoPath, repoName }]);
        }
      );
      totalDirs = totalDirsScanned;

      const collected: Repository[] = [];

      for (const repoPath of repoPaths) {
        const repoName = repoPath.split('/').slice(-1)[0] ?? repoPath;
        setScanEvents((prev) => [...prev, { type: 'fetching', repoPath, repoName }]);

        const repo = await getRepoActivity(repoPath, windowStart);

        setScanEvents((prev) => [
          ...prev,
          {
            type: 'fetched',
            repoPath,
            repoName,
            commitCount: repo.totalCommits,
            authorCount: repo.authors.length,
          },
        ]);

        if (repo.totalCommits > 0 || config.all) {
          collected.push(repo);
        }
      }

      const activeCount = collected.length;
      setScanEvents((prev) => [
        ...prev,
        { type: 'done', totalDirs, totalRepos: repoPaths.length, activeRepos: activeCount },
      ]);

      setRepos(collected);
      setIsScanComplete(true);
      setTimeout(() => setScreen('repos'), 600);
    };

    run().catch((err: unknown) => {
      console.error('Scanner error:', err);
      exit();
    });
  }, []);

  /** Handle going back one level in the navigation hierarchy. */
  function handleBack() {
    if (screen === 'diff') {
      setRawDiff('');
      setSelectedFile(null);
      setScreen('commits');
    } else if (screen === 'commits') {
      setSelectedCommit(null);
      setScreen('authors');
    } else if (screen === 'authors') {
      setSelectedAuthor(null);
      setScreen('repos');
    } else if (screen === 'repos') {
      setSelectedRepo(null);
    }
  }

  if (screen === 'scanning') {
    return (
      <ScanLog
        scanDir={process.cwd()}
        depth={config.depth}
        events={scanEvents}
        isComplete={isScanComplete}
      />
    );
  }

  // Build breadcrumb trail
  const breadcrumbItems: string[] = ['Repos'];
  if (selectedRepo) breadcrumbItems.push(selectedRepo.name);
  if (selectedAuthor) breadcrumbItems.push(selectedAuthor.name);
  if (selectedCommit) breadcrumbItems.push(selectedCommit.hash);
  if (selectedFile)
    breadcrumbItems.push(selectedFile.path.split('/').slice(-1)[0] ?? selectedFile.path);

  return (
    <Box flexDirection="column" padding={1}>
      {isRawModeSupported && <KeyboardHandler screen={screen} onBack={handleBack} />}

      <Header repoCount={repos.length} windowLabel={windowLabel} />
      <Breadcrumb items={breadcrumbItems} />

      {screen === 'repos' && (
        <RepoList
          repos={repos}
          onSelect={(repo: Repository) => {
            setSelectedRepo(repo);
            setScreen('authors');
          }}
        />
      )}

      {screen === 'authors' && selectedRepo && (
        <AuthorList
          authors={selectedRepo.authors}
          repoName={selectedRepo.name}
          onSelect={(author: Author) => {
            setSelectedAuthor(author);
            setScreen('commits');
          }}
          onBack={handleBack}
        />
      )}

      {screen === 'commits' && selectedRepo && selectedAuthor && (
        <CommitList
          commits={selectedAuthor.commits}
          authorName={selectedAuthor.name}
          repoName={selectedRepo.name}
          onSelectFile={(commit: Commit, file: FileChange) => {
            setSelectedCommit(commit);
            setSelectedFile(file);
            // Fetch the raw diff then navigate
            getFileDiff(selectedRepo.path, commit.hash, file.path)
              .then((diff) => {
                setRawDiff(diff);
                setScreen('diff');
              })
              .catch(() => {
                setRawDiff('');
                setScreen('diff');
              });
          }}
          onBack={handleBack}
        />
      )}

      {screen === 'diff' && selectedRepo && selectedCommit && selectedFile && (
        <DiffView
          repoPath={selectedRepo.path}
          commit={selectedCommit}
          file={selectedFile}
          rawDiff={rawDiff}
          onBack={handleBack}
        />
      )}

      {/* Fallback error states */}
      {screen === 'authors' && !selectedRepo && <Text color="red">Error: no repo selected</Text>}
      {screen === 'commits' && (!selectedRepo || !selectedAuthor) && (
        <Text color="red">Error: missing selection state</Text>
      )}
      {screen === 'diff' && (!selectedRepo || !selectedCommit || !selectedFile) && (
        <Text color="red">Error: missing diff selection state</Text>
      )}
    </Box>
  );
}
