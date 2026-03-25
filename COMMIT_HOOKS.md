# Git Commit Hooks Setup

This project uses **Husky** to manage git hooks that enforce code quality standards before commits and pushes.

## Tools Configured

### Pre-Commit Hook (`npx lint-staged`)

Runs **ESLint** and **Prettier** on staged files only (for speed):

- **ESLint**: TypeScript/JS linting with `@typescript-eslint` rules
  - Config: `eslint.config.js` (flat config format)
  - Ignores: node_modules, dist, .husky, .opencode
  - Rules: Strict TypeScript checking, no unused vars, no `console.log` in production
- **Prettier**: Code formatting
  - Config: `.prettierrc.json`
  - Settings: Single quotes, 2-space indent, 100-char line width, trailing commas

### Commit-Message Hook (`npx commitlint`)

Enforces **Conventional Commits** format:

- Config: `commitlint.config.js`
- Valid types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
- Format: `<type>: <description>` (e.g., `feat: add user authentication`)
- Commit message lint fails → commit is rejected

### Pre-Push Hook (npm test with 80% coverage)

Runs the full test suite with enforced coverage thresholds before pushing:

- Command: `npm test -- --coverage --coverage.lines=80 --coverage.branches=80 --coverage.functions=80 --coverage.statements=80`
- Runs `vitest run` with coverage collection and enforcement
- **Coverage thresholds**: 80% minimum for lines, branches, functions, and statements
- Test suite must pass AND coverage thresholds must be met → push is blocked on failure
- Catches regressions and coverage gaps early before they reach the remote

## File Structure

```
.husky/                    # Husky hook directory
├── pre-commit            # Runs lint-staged (ESLint + Prettier on staged files)
├── commit-msg            # Runs commitlint (Conventional Commits enforcement)
└── pre-push              # Runs tests with 80% coverage enforcement

eslint.config.js          # ESLint flat config (TypeScript + security rules)
.prettierrc.json          # Prettier formatting config
commitlint.config.js      # Commitlint config (Conventional Commits)
.lint-staged              # lint-staged config (runs linters on staged files)
tsconfig.json             # TypeScript config
vitest.config.ts          # Vitest test runner config
```

## Usage

### Install hooks (automatic on `npm install`)

```bash
npm install
# Or manually: npm run prepare
```

### Running tools manually

```bash
# Lint & fix all files
npm run lint              # Run ESLint
npm run format            # Run Prettier

# Type checking
npm run typecheck         # Run tsc --noEmit

# Tests
npm test                  # Run vitest

# Commit with valid message
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue with auth"
git commit -m "docs: update README"
```

### Bypassing hooks (not recommended)

```bash
# Skip all hooks
git commit --no-verify

# Skip pre-commit hook only
git push --no-verify
```

## Troubleshooting

### "husky is not installed"

```bash
npm install
npm run prepare
```

### Pre-commit hook fails → files not formatted

The hook will auto-fix files with ESLint and Prettier. After they're fixed, stage again and retry:

```bash
git add .
git commit -m "feat: description"
```

### Commit message rejected by commitlint

Use the correct format:

```bash
# ✗ Invalid
git commit -m "added feature"

# ✓ Valid
git commit -m "feat: add feature"
```

### Pre-push hook fails → tests didn't pass or coverage is below 80%

Fix the failing tests and ensure coverage meets the 80% threshold:

```bash
npm test -- --coverage      # Run tests with coverage report
npm run typecheck           # Check for type errors
npm test                    # Run tests again to verify fixes
git push
```

If coverage is below 80%, add more tests to increase coverage until all thresholds are met.

## Configuration References

- **ESLint**: https://eslint.org/docs/latest/use/configure/configuration-files
- **Prettier**: https://prettier.io/docs/en/configuration.html
- **Commitlint**: https://commitlint.js.org/
- **Husky**: https://typicode.github.io/husky/
- **lint-staged**: https://github.com/okonet/lint-staged
