# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

### Fixed

- Correct CI guard logic in prepare script (398128c)

## [v0.2.6] - 2026-03-27

### Fixed

- Skip husky in CI during prepare script (29b0345)

## [v0.2.5] - 2026-03-27

### Documentation

- Switch npm version badge from badge.fury.io to shields.io for faster cache updates (a103f7a)

### Fixed

- Harden terminal restore for command substitution (d212a6e)

### Miscellaneous

- Complete bun migration in release.yml workflows (d02c7ac)
- Remove package-lock.json and switch to better-npm-audit (e9b9f28)

### Testing

- Increase coverage to 90.22% across key components (75ceaee)

## [v0.2.4] - 2026-03-25

### Fixed

- Remove redundant tag push from publish job (e00030a)

## [v0.2.2] - 2026-03-25

### Fixed

- Trigger on tag creation instead of push to main (8c47be9)
- Update npm version hooks for tag-based releases (9f1608d)

## [v0.2.1] - 2026-03-25

### Documentation

- Update keybinding documentation in UI footers (530b47a)
- Add release workflow and npm version badges to README (5ba4f86)
- Update README to match current project state (1dbc183)
- Recreate README from scratch with comprehensive project documentation (f48d6a8)
- Format README markdown table (prettier) (d166a9f)

### Fixed

- Resolve ESLint errors and warnings (9ad45e3)
- Correct TOML syntax in cliff.toml changelog template (36a1ce0)
- Correct Jinja2 template syntax in cliff.toml footer (94d710e)

### Miscellaneous

- Add 80% coverage enforcement to pre-push hook (b051cf8)
- Fix moderate yaml vulnerability (1cd42c2)

### Testing

- Update footer keybinding test to match current UI (74cf991)
- Add CommitScreen interaction coverage tests (3cd8676)

## [v0.1.0] - 2026-03-25

### Added

- Add animated TUI splash screen with npx gitmag support (3407a10)
- Add Scanner hook and make splash screen scan-driven (adedde6)
- Add rainbow colors to gitmag ASCII letters (a2a37a9)
- Center splash screen animation in terminal (2cafbb1)
- Implement full terminal centering for splash screen (92f2ae8)
- Add repo screen with transition from splash (dff6119)
- Add navigation stack, keyboard input, and quit key (d0f0d5a)
- Add FileDiffScreen component for viewing unified diffs (278933b)
- Implement context-aware focus navigation in CommitScreen (2e4907e)
- Implement live git data layer with Repository and useRepository (7363ad6)
- Add error handling, branch resolution, performance caching, and integration tests (930ae69)
- Replace mock scanner with real git fetch progress (89c9d5f)
- Add remote ref badges to git graph display (2607503)
- Add working directory changes display as synthetic [WORKING] node (b4032e4)
- Preserve both commit and file selection when returning from diff (97b6c68)
- Add branch info panel to RepoScreen (1c3f8cd)
- Add branch info panel to CommitScreen (e47ae99)
- Add fuzzy search popup to CommitScreen (0308dda)
- Add live preview to fuzzy search (1ac863e)
- Display commit message in Commit Info panel (8ed3977)
- Add 'p' key to pick and return selected commit hash to stdout (6707e82)
- Remove j/k navigation keybinds from all screens (e9f967a)

### Changed

- Move Scanner.tsx to components directory (ac00140)
- Apply boxed panel layout to RepoScreen (34d6059)
- Add package-lock.json to pass ci action (cb9113c)
- Remove splash screen and scanner, start directly in repo screen (d249061)
- Gate splash screen on useRepository completion (1b264ef)
- Remove RepoScreen and navigate directly from splash to commits (e796c7e)
- Simplify redundant color ternaries in GraphRow component (41ee15d)
- Extract CommitScreen panels into separate components (6941b91)

### Documentation

- Add comprehensive README with summary, installation, and usage (d0566b1)
- Update README to highlight gitk-inspired lightweight TUI (69ebff9)
- Update README to reflect current project state (d852041)
- Update README to reflect current project state (d4131a9)

### Fixed

- Separate tsconfig for lint and build to allow test files (bc3e784)
- Simplify splash screen layout padding (37108a1)
- Consolidate input handling to fix hook render errors (6533796)
- Implement fullscreen rendering for all screens with proper terminal clearing (a46ba06)
- Clear timeout on unmount in SplashScreen (06351e3)
- Use stable keys in RepoScreen instead of array indices (2995e9b)
- Prevent exit call when canQuit is false in useQuit (88660b0)
- Remove unused idx parameter in CommitScreen (e0f6ae9)
- Wire real getDiff from Repository instance in FileDiffScreen (3143be5)
- Use full hash in getRefs() to match git log hashes (affa003)
- Restore file selection and focus when returning from diff view (8674bc6)
- Preserve file selection when returning from diff view (7b4d136)
- Enable 'q' key to quit app from all screens (77c4535)
- Ensure Enter key in fuzzy search closes popup and selects commit (a5c9664)
- Resolve stale closure in FuzzySearchPopup scroll/highlight logic (c21e150)
- Clamp panelWidth to available maxWidth to prevent layout overflow (1f2a4ec)
- Unskip non-git-dir test and fix temp dir isolation (a05ec62)
- Remove unused PanelProps export (231549f)
- Drain async state updates in useRepository initial loading test (a953fa0)
- Resolve git-cliff template syntax errors in cliff-release.toml (5aa0184)

### Miscellaneous

- Add git hooks for code quality (eslint, prettier, commitlint, husky) (5bcc8ab)
- Remove dist from git tracking (3534b80)
- Add start_dev.sh script for easier development (6209b8e)
- Change back navigation key from Escape to Backspace/Delete (f974832)
- Add clipboardy dependency for clipboard operations (4bda158)
- Add MIT license (5fd0a6c)
- Remove 6 unused dependencies following YAGNI (a8c9a6b)
- Upgrade ecc-universal from 1.8.0 to 1.9.0 (1de08eb)
- Remove start_dev.sh dev setup script (4a9406a)
- Set up continuous delivery with automated npm releases (ea06297)
- Generate changelog entry for release (910eed2)

### Performance

- Reduce splash screen logo render time from 2.2s to 1s (de0aa2d)
- Optimize startup time with batch git operations and dynamic imports (cb112d0)

### Testing

- Refactor splash screen tests and add completion gate hook (36199d1)
- Update RepoScreen tests to use new selectedIdx prop (cf7097e)
- Fix tests after RepoScreen removal and getBranchInfo addition (7bd961d)
- Remove duplicate Escape test in FuzzySearchPopup (82b9c6b)
- Add comprehensive tests for commit-screen components (06b67ba)

### Ci

- Add github actions workflow and update readme to reflect current state (bcec1da)

### Style

- Update panel border formatting in RepoScreen (cf25603)

[v0.2.6]: https://github.com/hizr/gitmag/releases/tag/v0.2.6[v0.2.5]: https://github.com/hizr/gitmag/releases/tag/v0.2.5[v0.2.4]: https://github.com/hizr/gitmag/releases/tag/v0.2.4[v0.2.2]: https://github.com/hizr/gitmag/releases/tag/v0.2.2[v0.2.1]: https://github.com/hizr/gitmag/releases/tag/v0.2.1[v0.1.0]: https://github.com/hizr/gitmag/releases/tag/v0.1.0
