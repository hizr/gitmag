# Git Magazine (gitmag)

[![CI](https://github.com/hizr/gitmag/actions/workflows/ci.yml/badge.svg)](https://github.com/hizr/gitmag/actions/workflows/ci.yml)
[![Release](https://github.com/hizr/gitmag/actions/workflows/release.yml/badge.svg)](https://github.com/hizr/gitmag/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/gitmag.svg)](https://badge.fury.io/js/gitmag)

A lightweight TUI application inspired by gitk, offering a streamlined experience for exploring git repositories directly from your terminal. Powered by live git data integration -- explore real commits, file changes, and diffs with keyboard-driven navigation and a beautiful animated interface.

## Summary

Git Magazine is a terminal-based git repository explorer built with React and Ink. It reads the git repository in the current working directory and presents an interactive, keyboard-driven interface for navigating commit history, viewing file changes, and inspecting diffs. The application opens in a fullscreen alternative terminal buffer with an animated splash screen, then transitions to a commit graph view with fuzzy search, branch info, and a unified diff viewer -- all powered by live git integration via `simple-git`.

## Features

- **Animated splash screen** with a scrambling/revealing "GITMAG" ASCII art title in rainbow colors
- **Live git integration** -- reads real commits, branches, refs, and file changes from your repository
- **ASCII commit graph** with lane-based rendering, merge connectors, and branch visualization
- **Working directory changes** -- synthetic node showing staged, unstaged, and untracked files
- **Branch info bar** -- current branch, remote tracking status, ahead/behind counts, HEAD author
- **Commit explorer** showing commit history, authors, dates, color-coded ref badges, messages, and changed files
- **Fuzzy search** (Fuse.js) with live preview -- search across messages, hashes, authors, refs, files, and dates
- **Unified diff viewer** with color-coded additions/deletions, toggleable line numbers, and scrolling
- **Clipboard support** -- copy commit SHA with a single keypress
- **Performance optimized** -- commit list caching for faster navigation in large repos
- **Keyboard-driven navigation** (vim-style j/k or arrow keys)

## Installation

```bash
# Clone the repository
git clone https://github.com/hizr/gitmag.git
cd gitmag

# Install dependencies
npm install
```

### CLI Binary

The project exposes a `gitmag` binary. After building, you can link it globally:

```bash
npm run build
npm link

# Then run from any git repository:
gitmag
```

## Running the Application

### Development

```bash
# Start the app in development mode (runs via tsx, no build step required)
npm run dev
```

### Production Build

```bash
# Build the application
npm run build

# Run the built application
node dist/index.js
```

## Keyboard Controls

| Key            | Screen         | Action                         |
| -------------- | -------------- | ------------------------------ |
| `↑` / `k`      | All            | Move up                        |
| `↓` / `j`      | All            | Move down                      |
| `Tab`          | CommitScreen   | Cycle focus (graph → files)    |
| `Enter`        | CommitScreen   | View diff for selected file    |
| `/`            | CommitScreen   | Open fuzzy search              |
| `ESC`          | CommitScreen   | Close search or clear matches  |
| `n` / `m`      | CommitScreen   | Next/previous search match     |
| `c`            | CommitScreen   | Copy commit SHA to clipboard   |
| `p`            | CommitScreen   | Pick commit (for external use) |
| `l`            | FileDiffScreen | Toggle line numbers            |
| `Bksp` / `Del` | All            | Go back                        |
| `q`            | All            | Quit application               |

## Project Structure

```
src/
├── index.ts                           # Entry point (#!/usr/bin/env node shebang)
├── cli.ts                             # CLI bootstrapper (alt screen, cursor hide, Ink render)
├── app.tsx                            # Main App component with stack-based routing
├── components/
│   ├── CommitScreen.tsx               # Commit history explorer (graph, info, files panels)
│   ├── commit-screen/                 # Commit screen sub-components
│   │   ├── BranchInfoPanel.tsx        # Displays current branch and remote tracking status
│   │   ├── ChangedFilesPanel.tsx      # Lists changed files with selection
│   │   ├── CommitInfoPanel.tsx        # Shows commit metadata (hash, author, date, message)
│   │   ├── GraphRow.tsx               # Single row of ASCII commit graph
│   │   └── commit-screen.utils.ts     # Utility functions for commit screen
│   ├── FileDiffScreen.tsx             # Unified diff viewer with color-coding & line numbers
│   ├── FuzzySearchPopup.tsx           # Fuzzy search overlay with live preview
│   ├── SplashScreen.tsx               # Animated ASCII art title with scramble/reveal effect
│   ├── Scanner.tsx                    # Loading screen with progress indicator
│   └── common/
│       └── Panel.tsx                  # Reusable panel wrapper component
├── data/
│   ├── Repository.ts                  # Git repository wrapper class (simple-git, caching)
│   └── mockRepos.ts                   # Mock data and type definitions for testing
├── hooks/
│   ├── useRepository.ts               # Load commits, refs, working changes from live git repo
│   ├── useAppInput.ts                 # Centralized keyboard input handler
│   ├── useQuit.ts                     # Global 'q' to quit handler
│   └── useCompletionGate.ts           # Gate callback on two boolean conditions
└── utils/
    └── git-graph.ts                   # ASCII git graph builder (lane-based algorithm)

tests/
├── components/
│   ├── commit-screen/
│   │   ├── BranchInfoPanel.test.tsx
│   │   ├── ChangedFilesPanel.test.tsx
│   │   ├── CommitInfoPanel.test.tsx
│   │   └── commit-screen.utils.test.ts
│   ├── CommitScreen.test.tsx
│   ├── FileDiffScreen.test.tsx
│   ├── FuzzySearchPopup.test.tsx
│   └── SplashScreen.test.tsx
├── cli.test.ts
├── data/
│   ├── Repository.test.ts
│   └── Repository.integration.test.ts
├── hooks/
│   ├── useRepository.test.ts
│   ├── useQuit.test.ts
│   └── useCompletionGate.test.ts
└── utils/
    └── git-graph.test.ts
```

## Development

### Scripts

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format

# Run all tests
npm test

# Watch mode (auto-rerun on file changes)
npm test -- --watch

# With coverage report
npm test -- --coverage
```

## Technologies

| Technology  | Version | Purpose                         |
| ----------- | ------- | ------------------------------- |
| React       | 18.3.1  | UI component library            |
| Ink         | 5.2.1   | React renderer for the terminal |
| TypeScript  | 5.9.3   | Type safety                     |
| simple-git  | 3.33.0  | Git repository integration      |
| Fuse.js     | 7.1.0   | Fuzzy search / filtering        |
| clipboardy  | 5.3.1   | Cross-platform clipboard access |
| @inkjs/ui   | 2.0.0   | Pre-built Ink components        |
| Vitest      | 4.1.0   | Testing framework               |
| ESLint      | 10.0.3  | Code linting (flat config)      |
| Prettier    | 3.8.1   | Code formatting                 |
| Husky       | 9.1.7   | Git hooks management            |
| commitlint  | 20.4.4  | Conventional commit enforcement |
| lint-staged | 16.3.3  | Run linters on staged files     |
| tsx         | 4.21.0  | TypeScript execution for dev    |
| knip        | 6.0.1   | Dead code detection             |
| jscpd       | 4.0.8   | Code duplication detection      |

## Testing

The project includes **15 test files** with **226+ passing tests** (1 failing) across all layers:

| Category          | Details                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Unit Tests        | Repository, hooks (useRepository, useQuit, useCompletionGate), git-graph, utility functions    |
| Integration Tests | Real temporary git repos (add/modify/delete files, diffs, branch detection)                    |
| Component Tests   | CommitScreen, FileDiffScreen, SplashScreen, FuzzySearchPopup, sub-components, CLI bootstrapper |

All tests run automatically on every push via the GitHub Actions CI pipeline and on every local push via the pre-push git hook.

### Running Tests Locally

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on file changes)
npm test -- --watch

# With coverage report
npm test -- --coverage
```

## CI/CD

The project uses **GitHub Actions** with comprehensive automated workflows:

### CI Workflow (ci.yml)

Triggered on every push and pull request:

- **Type checking** -- runs `npm run typecheck`
- **Linting** -- runs `npm run lint`
- **Dead code detection** -- runs `npm run dead-code` (knip)
- **Duplication detection** -- runs `npm run duplication` (jscpd)
- **Security audit** -- runs `npm run audit`
- **Tests with coverage** -- runs `npm test` with 80% minimum coverage enforcement across lines, branches, functions, and statements
- **Production build** -- runs `npm run build` and verifies dist size doesn't exceed 5 MB

All jobs run on Ubuntu latest with Node.js 24.

### Release & Publish Workflow (release.yml)

Triggered on pushes to `main` when `package.json` version changes:

1. **Check Version** -- detects if version has been bumped in package.json
2. **Quality Gates** -- runs all CI checks (type checking, linting, tests, build)
3. **Generate Changelog** -- creates changelog entry using git-cliff
4. **Publish to npm** -- publishes the package to npm registry and creates git tag
5. **Create GitHub Release** -- creates GitHub release with changelog

## Git Hooks & Commit Conventions

The project enforces code quality through three git hooks managed by **Husky**:

| Hook         | Command           | Purpose                                                  |
| ------------ | ----------------- | -------------------------------------------------------- |
| `pre-commit` | `npx lint-staged` | Runs ESLint (with auto-fix) and Prettier on staged files |
| `commit-msg` | `npx commitlint`  | Enforces conventional commit format                      |
| `pre-push`   | `npm test`        | Runs the full test suite before pushing                  |

Commit messages must follow the **Conventional Commits** format:

```
<type>: <short description>
```

Valid types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

See [COMMIT_HOOKS.md](COMMIT_HOOKS.md) for detailed documentation on hooks configuration and troubleshooting.

## License

This project is licensed under the [MIT License](LICENSE).
