# Git Magazine (gitmag) Testchange

[![CI](https://github.com/hizr/gitmag/actions/workflows/ci.yml/badge.svg)](https://github.com/hizr/gitmag/actions/workflows/ci.yml)
[![Release](https://github.com/hizr/gitmag/actions/workflows/release.yml/badge.svg)](https://github.com/hizr/gitmag/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/gitmag.svg)](https://www.npmjs.com/package/gitmag)

A lightweight, keyboard-driven TUI application for exploring git repositories directly from your terminal. Inspired by `gitk`, Git Magazine delivers a streamlined, interactive experience with live git data integration, ASCII commit graphs, fuzzy search, and a unified diff viewer.

## Quick Start

```bash
# Install globally from npm
npm install -g gitmag

# Or clone and run locally
git clone https://github.com/hizr/gitmag.git
cd gitmag
npm install
npm run build
npm link

# Run in any git repository
gitmag
```

## Features

- **Animated splash screen** – Scrambling/revealing "GITMAG" ASCII art title with rainbow colors
- **Live git integration** – Reads real commits, branches, refs, and working directory changes from your repository
- **ASCII commit graph** – Lane-based rendering with merge connectors and branch visualization
- **Working directory view** – Synthetic node showing staged, unstaged, and untracked files with per-row staging indicators (`[●]` staged / `[○]` unstaged / `[?]` untracked) and one-key stage/unstage via `+`
- **Branch info bar** – Current branch, remote tracking status, ahead/behind counts, and HEAD author
- **Commit explorer** – Interactive navigation through commit history with authors, dates, color-coded ref badges, and messages
- **Unified diff viewer** – Color-coded additions/deletions, toggleable line numbers, and smooth scrolling
- **Fuzzy search** – Live search across commit messages, hashes, authors, refs, file names, and dates (powered by Fuse.js)
- **Clipboard integration** – Copy commit SHA to clipboard with a single keypress
- **Pick commits** – Select and return commit hashes to stdout for use in scripts
- **Performance optimized** – Commit list caching for faster navigation in large repositories

## Keyboard Controls

| Key            | Screen         | Action                             |
| -------------- | -------------- | ---------------------------------- |
| `↑`            | All            | Move up                            |
| `↓`            | All            | Move down                          |
| `Tab`          | CommitScreen   | Cycle focus (graph → files)        |
| `Enter`        | CommitScreen   | View diff for selected file        |
| `+`            | CommitScreen   | Stage / unstage file (working dir) |
| `/`            | CommitScreen   | Open fuzzy search                  |
| `ESC`          | CommitScreen   | Close search or clear results      |
| `n` / `m`      | CommitScreen   | Next/previous search match         |
| `c`            | CommitScreen   | Copy commit SHA to clipboard       |
| `p`            | CommitScreen   | Pick commit (return hash)          |
| `l`            | FileDiffScreen | Toggle line numbers                |
| `Bksp` / `Del` | All            | Go back to previous screen         |
| `q`            | All            | Quit application                   |

## Installation & Setup

### From npm

```bash
npm install -g gitmag

# Run in any git repository
gitmag
```

### From Source

```bash
git clone https://github.com/hizr/gitmag.git
cd gitmag

# Install dependencies
npm install

# Run in development mode (no build required, uses tsx)
npm run dev

# Build for production
npm run build

# Run the built binary
node dist/index.js

# Link globally for use anywhere
npm link
gitmag
```

## Development

### Available Scripts

```bash
# Start development server (tsx, no build step)
npm run dev

# Build TypeScript → JavaScript
npm run build

# Type checking
npm run typecheck

# Lint code (ESLint with flat config)
npm run lint

# Format code (Prettier)
npm run format

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Dead code detection (knip)
npm run dead-code

# Code duplication detection (jscpd)
npm run duplication

# Security audit
npm run audit
```

### Project Structure

```
src/
├── index.ts                           # Entry point with #!/usr/bin/env node shebang
├── cli.ts                             # CLI bootstrapper (alt screen, cursor hide, Ink render)
├── app.tsx                            # Main App component with stack-based routing
├── components/
│   ├── CommitScreen.tsx               # Commit history explorer (graph, info, files panels)
│   ├── commit-screen/                 # Commit screen sub-components
│   │   ├── BranchInfoPanel.tsx        # Displays current branch and remote tracking status
│   │   ├── ChangedFilesPanel.tsx      # Lists changed files with selection indicator
│   │   ├── CommitInfoPanel.tsx        # Shows commit metadata (hash, author, date, message)
│   │   ├── GraphRow.tsx               # Single row of ASCII commit graph with lane rendering
│   │   └── commit-screen.utils.ts     # Utility functions for commit screen layout
│   ├── FileDiffScreen.tsx             # Unified diff viewer with color-coding and line numbers
│   ├── FuzzySearchPopup.tsx           # Fuzzy search overlay with live preview
│   ├── SplashScreen.tsx               # Animated ASCII art title with scramble/reveal effect
│   ├── Scanner.tsx                    # Loading screen with progress indicator
│   └── common/
│       └── Panel.tsx                  # Reusable panel wrapper component
├── data/
│   ├── Repository.ts                  # Git repository wrapper class (simple-git API, caching)
│   └── mockRepos.ts                   # Mock data and type definitions for testing
├── hooks/
│   ├── useRepository.ts               # Load commits, refs, working changes from git repo
│   ├── useAppInput.ts                 # Centralized keyboard input handler
│   ├── useQuit.ts                     # Global 'q' key to quit handler
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
│   ├── CommitScreen.test.tsx          # 33 tests
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

### Technology Stack

| Technology  | Version | Purpose                          |
| ----------- | ------- | -------------------------------- |
| React       | 18.3.1  | UI component library             |
| Ink         | 5.2.1   | React renderer for the terminal  |
| TypeScript  | 5.9.3   | Type safety and static analysis  |
| simple-git  | 3.33.0  | Git repository integration       |
| Fuse.js     | 7.1.0   | Fuzzy search / filtering         |
| clipboardy  | 5.3.1   | Cross-platform clipboard access  |
| @inkjs/ui   | 2.0.0   | Pre-built terminal UI components |
| Vitest      | 4.1.0   | Fast unit testing framework      |
| ESLint      | 10.0.3  | Code linting with flat config    |
| Prettier    | 3.8.1   | Code formatting                  |
| Husky       | 9.1.7   | Git hooks management             |
| commitlint  | 20.4.4  | Enforce conventional commits     |
| lint-staged | 16.3.3  | Run linters on staged files      |
| tsx         | 4.21.0  | TypeScript execution for dev     |
| knip        | 6.0.1   | Dead code detection              |
| jscpd       | 4.0.8   | Code duplication detection       |

## Testing

The project maintains **100%+ test coverage** with **226+ passing tests** across **15 test files**:

| Category          | Coverage                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| Unit Tests        | Repository class, hooks (useRepository, useQuit, useCompletionGate), git-graph    |
| Integration Tests | Real temporary git repos with file operations, diffs, and branch detection        |
| Component Tests   | CommitScreen, FileDiffScreen, SplashScreen, FuzzySearchPopup, sub-components, CLI |

All tests run automatically on every push via GitHub Actions CI and on every local push via the `pre-push` git hook.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (rerun on file changes)
npm test -- --watch

# Run with coverage report
npm test -- --coverage

# Run a specific test file
npm test -- tests/components/CommitScreen.test.tsx

# Run tests matching a pattern
npm test -- -t "fuzzy search"
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Workflow (`ci.yml`)

Runs on every push and pull request:

- **Type checking** – `npm run typecheck`
- **Linting** – `npm run lint` (ESLint with security and SonarJS plugins)
- **Dead code detection** – `npm run dead-code` (knip)
- **Code duplication** – `npm run duplication` (jscpd with 80-token threshold)
- **Security audit** – `npm run audit` (npm audit with high-level threshold)
- **Tests with coverage** – `npm test` with **80% minimum coverage** enforced (lines, branches, functions, statements)
- **Production build** – `npm run build` with **5 MB size limit** verification

**Environment:** Ubuntu latest, Node.js 24

#### Release & Publish Workflow (`release.yml`)

Triggers on pushes to `main` when `package.json` version changes:

1. **Version Check** – Detects if version has been bumped in package.json
2. **Quality Gates** – Runs all CI checks (type checking, linting, tests, build)
3. **Changelog Generation** – Creates changelog entry using git-cliff
4. **npm Publishing** – Publishes package to npm registry
5. **Git Tag** – Creates annotated version tag
6. **GitHub Release** – Creates GitHub release with changelog

**Environment:** Ubuntu latest, Node.js 24

## Git Hooks & Commit Standards

The project uses **Husky** to enforce code quality through automated git hooks:

| Hook         | Command       | Purpose                                              |
| ------------ | ------------- | ---------------------------------------------------- |
| `pre-commit` | `lint-staged` | Auto-fix and format staged files (ESLint + Prettier) |
| `commit-msg` | `commitlint`  | Enforce conventional commit format                   |
| `pre-push`   | `npm test`    | Run full test suite before pushing                   |

### Conventional Commits

All commits follow the **Conventional Commits** format:

```
<type>: <short description>

<optional body explaining the why>
```

**Valid types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Examples:

```
feat: add fuzzy search to commit explorer
fix: resolve memory leak in commit list
docs: update keyboard controls documentation
test: add integration tests for Repository class
chore: upgrade TypeScript to 5.9.3
```

See [COMMIT_HOOKS.md](COMMIT_HOOKS.md) for detailed hook configuration and troubleshooting.

## Code Quality & Performance

- **Immutability first** – All updates return new objects via spread or helpers
- **Small modules** – Aim for 200–400 line files, hard max 800
- **Small functions** – Keep functions under ~50 lines with single responsibility
- **No deep nesting** – Maximum 4 indentation levels; use early returns for flat logic
- **Type safety** – Full TypeScript coverage with strict mode enabled
- **Zero console.log** – Use proper logging instead (none currently needed for TUI)
- **Performance** – Commit list caching, efficient git-graph rendering, lazy loading

## Architecture Highlights

- **Stack-based routing** – Clean navigation between screens (CommitScreen → FileDiffScreen → back)
- **Live git integration** – Uses `simple-git` with optimized queries and caching
- **Lane-based graph rendering** – Efficient ASCII commit graph with merge visualization
- **Keyboard-first design** – All interactions mapped to keyboard shortcuts
- **React + Ink** – Modern React patterns with Ink's terminal renderer

## Contributing

Contributions are welcome! Please:

1. Follow the development workflow in AGENTS.md
2. Write tests for new features (80%+ coverage required)
3. Use conventional commits
4. Run `npm test` and `npm run lint` before pushing
5. Ensure all git hooks pass

## License

This project is licensed under the [MIT License](LICENSE).

---

**Built with** React, Ink, TypeScript, and simple-git for the modern terminal developer.
