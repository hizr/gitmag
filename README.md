# Git Magazine (gitmag)

[![CI](https://github.com/hizr/gitmag/actions/workflows/ci.yml/badge.svg)](https://github.com/hizr/gitmag/actions/workflows/ci.yml)

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

| Key                | Screen         | Action                        |
| ------------------ | -------------- | ----------------------------- |
| `j` / Down Arrow   | All            | Move down                     |
| `k` / Up Arrow     | All            | Move up                       |
| Tab                | CommitScreen   | Cycle focus (graph → files)   |
| Enter              | CommitScreen   | View diff for selected file   |
| `/`                | CommitScreen   | Open fuzzy search             |
| `ESC`              | CommitScreen   | Close search or clear matches |
| `n` / `m`          | CommitScreen   | Next/previous search match    |
| `c`                | CommitScreen   | Copy commit SHA to clipboard  |
| `l`                | FileDiffScreen | Toggle line numbers           |
| Backspace / Delete | All            | Go back                       |
| `q`                | All            | Quit application              |

## Project Structure

```
src/
├── index.ts                  # Entry point (#!/usr/bin/env node shebang)
├── cli.ts                    # CLI bootstrapper (alt screen, cursor hide, Ink render)
├── app.tsx                   # Main App component with stack-based routing
├── components/
│   ├── SplashScreen.tsx      # Animated ASCII art title with scramble/reveal effect
│   ├── CommitScreen.tsx      # Commit history explorer (graph, info, files panels)
│   ├── FileDiffScreen.tsx    # Unified diff viewer with color-coding & line numbers
│   ├── FuzzySearchPopup.tsx  # Fuzzy search overlay with live preview
│   └── Scanner.tsx           # ScanProgress interface / type definitions
├── data/
│   ├── Repository.ts         # Git repository wrapper class (simple-git, caching)
│   └── mockRepos.ts          # Domain model type definitions & exports
├── hooks/
│   ├── useRepository.ts      # Load commits, refs, working changes from live git repo
│   ├── useAppInput.ts        # Centralized keyboard input handler
│   ├── useQuit.ts            # Global 'q' to quit handler
│   └── useCompletionGate.ts  # Gate callback on two boolean conditions
└── utils/
    └── git-graph.ts          # ASCII git graph builder (lane-based algorithm)

tests/
├── components/
│   ├── CommitScreen.test.tsx
│   ├── FileDiffScreen.test.tsx
│   ├── SplashScreen.test.tsx
│   └── FuzzySearchPopup.test.tsx
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
| React       | 18.3    | UI component library            |
| Ink         | 5.2     | React renderer for the terminal |
| TypeScript  | 5.9     | Type safety                     |
| simple-git  | 3.33    | Git repository integration      |
| Fuse.js     | 7.1     | Fuzzy search / filtering        |
| clipboardy  | 5.3     | Cross-platform clipboard access |
| @inkjs/ui   | 2.0     | Pre-built Ink components        |
| Vitest      | 4.1     | Testing framework               |
| ESLint      | 10.0    | Code linting (flat config)      |
| Prettier    | 3.8     | Code formatting                 |
| Husky       | 9.1     | Git hooks management            |
| commitlint  | 20.4    | Conventional commit enforcement |
| lint-staged | 16.3    | Run linters on staged files     |
| tsx         | 4.21    | TypeScript execution for dev    |

## Testing

The project includes **10 test files** with **100+ passing tests** across all layers:

| Category          | Details                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Unit Tests        | Repository, hooks (useRepository, useQuit, useCompletionGate), git-graph    |
| Integration Tests | Real temporary git repos (add/modify/delete files, diffs, branch detection) |
| Component Tests   | CommitScreen, FileDiffScreen, SplashScreen, FuzzySearchPopup                |

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

The project uses **GitHub Actions** with two jobs triggered on pushes to `main`/`develop` and on pull requests:

1. **Test & Type Check & Lint** -- runs `npm run typecheck`, `npm run lint`, and `npm test`
2. **Build** -- runs `npm run build` to verify the project compiles

Both jobs run on Ubuntu latest with Node.js 24.

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
