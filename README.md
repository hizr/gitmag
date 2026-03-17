# Git Magazine (gitmag)

A terminal-based Git repository explorer that displays repository information and commit history with an animated splash screen.

## Summary

Git Magazine is a CLI tool that scans your repositories and presents them in an interactive terminal interface. Navigate through your repos, explore commit history, and view repository activity—all within a beautiful, animated terminal UI built with React and Ink.

## Features

- **Animated splash screen** with a scrambling/revealing "gitmag" title
- **Interactive repository browser** with keyboard navigation
- **Commit explorer** showing commit history for each repository
- **Repository scanning** with real-time progress updates
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

| Key              | Action                           |
| ---------------- | -------------------------------- |
| `j` / Down Arrow | Move down                        |
| `k` / Up Arrow   | Move up                          |
| Enter            | Select repository / view commits |
| Esc              | Go back                          |
| `q`              | Quit application                 |

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
├── components/       # React components (SplashScreen, RepoScreen, CommitScreen)
├── hooks/           # Custom React hooks (useScanner, useAppInput, etc.)
├── data/            # Mock data and types
├── app.tsx          # Main app component
├── cli.ts           # CLI entry point
└── index.ts         # Application entry point

tests/
├── components/      # Component tests
├── hooks/          # Hook tests
└── utils/          # Utility tests
```

## Technologies

- **React** - UI library
- **Ink** - React renderer for terminal
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Notes

- The application requires a TTY (terminal) environment to run
- Mock repository data is used for demonstration
- Full Git integration for real repositories is a potential future enhancement
