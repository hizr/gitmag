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

### Pre-Push Hook (`npm test`)

Runs the full test suite before pushing:

- Command: `npm test` (runs `vitest run`)
- Test suite must pass → push is blocked on failure
- Catches regressions early before they reach the remote

## File Structure

```
.husky/                    # Husky hook directory
├── pre-commit            # Runs lint-staged
├── commit-msg            # Runs commitlint
└── pre-push              # Runs npm test

eslint.config.js          # ESLint flat config (TypeScript + Prettier)
.prettierrc.json          # Prettier formatting config
commitlint.config.js      # Commitlint config (Conventional Commits)
tsconfig.json             # TypeScript config
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

### Pre-push hook fails → tests didn't pass

Fix the failing tests and try pushing again:

```bash
npm test              # Run tests to debug
npm run typecheck     # Check for type errors
git push
```

## Configuration References

- **ESLint**: https://eslint.org/docs/latest/use/configure/configuration-files
- **Prettier**: https://prettier.io/docs/en/configuration.html
- **Commitlint**: https://commitlint.js.org/
- **Husky**: https://typicode.github.io/husky/
- **lint-staged**: https://github.com/okonet/lint-staged
