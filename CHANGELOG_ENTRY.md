## [Unreleased]

### Added

- Add animated TUI splash screen with npx gitmag support

- Add Scanner hook and make splash screen scan-driven

- Add rainbow colors to gitmag ASCII letters

- Center splash screen animation in terminal

- Implement full terminal centering for splash screen

- Add repo screen with transition from splash

- Add navigation stack, keyboard input, and quit key

- Add FileDiffScreen component for viewing unified diffs

- Implement context-aware focus navigation in CommitScreen

- Implement live git data layer with Repository and useRepository

- Add error handling, branch resolution, performance caching, and integration tests

- Replace mock scanner with real git fetch progress

- Add remote ref badges to git graph display

- Add working directory changes display as synthetic [WORKING] node

- Preserve both commit and file selection when returning from diff

- Add branch info panel to RepoScreen

- Add branch info panel to CommitScreen

- Add fuzzy search popup to CommitScreen

- Add live preview to fuzzy search

- Display commit message in Commit Info panel

- Add 'p' key to pick and return selected commit hash to stdout

- Remove j/k navigation keybinds from all screens

### Changed

- Move Scanner.tsx to components directory

- Apply boxed panel layout to RepoScreen

- Add package-lock.json to pass ci action

- Remove splash screen and scanner, start directly in repo screen

- Gate splash screen on useRepository completion

- Remove RepoScreen and navigate directly from splash to commits

- Simplify redundant color ternaries in GraphRow component

- Extract CommitScreen panels into separate components

### Documentation

- Add comprehensive README with summary, installation, and usage

- Update README to highlight gitk-inspired lightweight TUI

- Update README to reflect current project state

- Update README to reflect current project state

### Fixed

- Separate tsconfig for lint and build to allow test files

- Simplify splash screen layout padding

- Consolidate input handling to fix hook render errors

- Implement fullscreen rendering for all screens with proper terminal clearing

- Clear timeout on unmount in SplashScreen

- Use stable keys in RepoScreen instead of array indices

- Prevent exit call when canQuit is false in useQuit

- Remove unused idx parameter in CommitScreen

- Wire real getDiff from Repository instance in FileDiffScreen

- Use full hash in getRefs() to match git log hashes

- Restore file selection and focus when returning from diff view

- Preserve file selection when returning from diff view

- Enable 'q' key to quit app from all screens

- Ensure Enter key in fuzzy search closes popup and selects commit

- Resolve stale closure in FuzzySearchPopup scroll/highlight logic

- Clamp panelWidth to available maxWidth to prevent layout overflow

- Unskip non-git-dir test and fix temp dir isolation

- Remove unused PanelProps export

- Drain async state updates in useRepository initial loading test

### Miscellaneous

- Add git hooks for code quality (eslint, prettier, commitlint, husky)

- Remove dist from git tracking

- Add start_dev.sh script for easier development

- Change back navigation key from Escape to Backspace/Delete

- Add clipboardy dependency for clipboard operations

- Add MIT license

- Remove 6 unused dependencies following YAGNI

- Upgrade ecc-universal from 1.8.0 to 1.9.0

- Remove start_dev.sh dev setup script

- Set up continuous delivery with automated npm releases

### Performance

- Reduce splash screen logo render time from 2.2s to 1s

- Optimize startup time with batch git operations and dynamic imports

### Testing

- Refactor splash screen tests and add completion gate hook

- Update RepoScreen tests to use new selectedIdx prop

- Fix tests after RepoScreen removal and getBranchInfo addition

- Remove duplicate Escape test in FuzzySearchPopup

- Add comprehensive tests for commit-screen components

### Ci

- Add github actions workflow and update readme to reflect current state

### Style

- Update panel border formatting in RepoScreen
