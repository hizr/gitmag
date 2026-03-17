# Git Magazine (gitmag)

[![CI](https://github.com/hizr/gitmag/actions/workflows/ci.yml/badge.svg)](https://github.com/hizr/gitmag/actions/workflows/ci.yml)

A terminal-based Git repository explorer that displays repository information and commit history with an animated splash screen. Powered by live git data integration—explore real commits, file changes, and diffs directly from your repository.

## Summary

Git Magazine is a CLI tool that reads real git repositories and presents them in an interactive terminal interface. Navigate through your repos, explore commit history, view file changes, and inspect diffs—all within a beautiful, animated terminal UI built with React and Ink. Powered by `simple-git` for live repository access.

## Features

- **Animated splash screen** with a scrambling/revealing "gitmag" title
- **Live git integration** — reads real commits, branches, and file changes from your repository
- **Interactive repository browser** with keyboard navigation (up/down, enter to select)
- **Commit explorer** showing commit history, authors, dates, and file changes
- **Unified diff viewer** with color-coded changes, line numbers (toggleable), and scrolling
- **Branch detection** — automatically resolves which branch each commit belongs to
- **Performance optimized** — commit list caching for faster navigation in large repos
- **Keyboard-driven navigation** (vim-style j/k or arrow keys)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gitmag.git
cd gitmag

# Install dependencies
npm install
```

## Running the Application

### Development

```bash
# Start the app in development mode
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

| Key                | Screen         | Action                      |
| ------------------ | -------------- | --------------------------- |
| `j` / Down Arrow   | All            | Move down                   |
| `k` / Up Arrow     | All            | Move up                     |
| Enter              | RepoScreen     | Select repository           |
| Enter              | CommitScreen   | View diff for selected file |
| `l`                | FileDiffScreen | Toggle line numbers         |
| Backspace / Delete | All            | Go back                     |
| `q`                | All            | Quit application            |

## Development

### Scripts

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format
```

## Project Structure

```
src/
├── components/           # React/Ink components
│   ├── SplashScreen.tsx   # Animated title reveal
│   ├── RepoScreen.tsx     # Repository list browser
│   ├── CommitScreen.tsx   # Commit history explorer
│   ├── FileDiffScreen.tsx # Unified diff viewer with scrolling & line numbers
│   └── Scanner.tsx        # Repository scanner with progress
├── data/
│   ├── Repository.ts      # Live git repository wrapper (simple-git integration)
│   └── mockRepos.ts       # Type definitions & exports
├── hooks/
│   ├── useRepository.ts   # Load commits from live git repo
│   ├── useScanner.ts      # Repository scanning progress
│   └── useAppInput.ts     # Global keyboard navigation handler
├── app.tsx               # Main app component & routing
├── cli.ts                # CLI argument parser
└── index.ts              # Application entry point

tests/
├── components/           # Component integration tests
├── hooks/               # Hook tests (with mocked Repository)
├── data/                # Data layer tests (real temp git repos)
└── utils/               # Utility tests
```

## Technologies

- **React 18** - UI library
- **Ink 5** - React renderer for terminal
- **TypeScript 5** - Type safety
- **simple-git 3** - Git repository integration
- **Vitest 4** - Testing framework
- **ESLint 10** - Code linting
- **Prettier 3** - Code formatting
- **Commander** - CLI argument parsing

## Test Coverage

The project includes **11 test files** with **95 passing tests** across all layers:

| Category          | Count          | Details                                                                      |
| ----------------- | -------------- | ---------------------------------------------------------------------------- |
| Unit Tests        | 80+            | Repository, hooks, utilities                                                 |
| Integration Tests | 15             | Real temporary git repos (add/modify/delete files, diffs, branch resolution) |
| Component Tests   | 5+             | RepoScreen, CommitScreen, FileDiffScreen                                     |
| **Total**         | **95 passing** | 1 test skipped (non-critical)                                                |

All tests run automatically on every commit via GitHub Actions CI pipeline.

### Running Tests Locally

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on file changes)
npm test -- --watch

# With coverage report
npm test -- --coverage
```
