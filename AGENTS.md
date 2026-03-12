# AGENTS.md — Git Magazine

This file provides guidance for AI coding agents operating in this repository.
It is derived from project configuration and the bundled `ecc-universal` rules.

---

## Project Overview

**Git Magazine** is a content/web project bootstrapped with
[OpenCode](https://opencode.ai) and the
[`ecc-universal`](https://github.com/affaan-m/everything-claude-code) agent
performance package. The stack has not yet been fully determined — consult
`package.json` and any framework config files before assuming a specific
runtime, bundler, or test framework.

---

## Build / Lint / Test Commands

> No build tooling has been configured yet. Add the actual commands here as
> the project is set up. The patterns below are the expected conventions.

```bash
# Install dependencies
npm install

# Development server (once configured)
npm run dev

# Production build
npm run build

# Type checking (TypeScript)
npm run typecheck         # or: npx tsc --noEmit

# Lint
npm run lint              # or: npx eslint . / npx biome lint .

# Format
npm run format            # or: npx prettier --write . / npx biome format --write .

# Run all tests
npm test                  # or: npx vitest / npx jest

# Run a single test file
npx vitest run src/path/to/file.test.ts
npx jest src/path/to/file.test.ts

# Run tests matching a name pattern
npx vitest run -t "pattern"
npx jest -t "pattern"

# Test coverage
npx vitest run --coverage
npx jest --coverage
```

When a build or test fails, use the **build-error-resolver** or **tdd-guide**
sub-agents before attempting manual fixes.

---

## Development Workflow

Follow the mandatory feature implementation pipeline (from `ecc-universal`):

1. **Research & Reuse** — search GitHub (`gh search code`), npm, and the web
   before writing net-new code. Prefer proven libraries over hand-rolled
   solutions.
2. **Plan** — use the **planner** agent to produce a PRD, architecture doc,
   and task list before touching source files.
3. **TDD** — write tests first (RED), implement to pass (GREEN), refactor
   (IMPROVE). Minimum **80% coverage** is required.
4. **Code Review** — invoke the **code-reviewer** agent after every meaningful
   change. Address all CRITICAL and HIGH findings before moving on.
5. **Security Check** — run the **security-reviewer** agent before committing.
   Never commit with known CRITICAL security issues open.
6. **Commit** — follow conventional-commit format (see Git section below).

---

## Code Style

### General

- **Immutability first** — never mutate existing objects; always return a new
  copy via spread or a helper.
- **Small files** — aim for 200–400 lines; hard max 800. Extract utilities
  aggressively. Prefer many small, focused modules over few large ones.
- **Small functions** — keep functions under ~50 lines. One clear
  responsibility per function.
- **No deep nesting** — maximum 4 levels of indentation. Extract to helpers
  or use early-return patterns to flatten logic.
- **No hardcoded values** — use named constants or config files.
- **No `console.log` in production code** — use a proper logging library.

### TypeScript / JavaScript

- Use `async`/`await` with `try`/`catch` for all async operations.
- Use **Zod** (or equivalent schema library) for input validation at system
  boundaries. Never trust external data.
- Use spread for immutable updates:
  ```typescript
  // Correct
  return { ...user, name }

  // Wrong
  user.name = name; return user
  ```
- Prefer `interface` for public API shapes; `type` for unions/intersections.
- Prefer `const` over `let`; never use `var`.
- Export named exports; avoid default exports in library/utility code.

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Files (TS/JS) | `kebab-case` | `git-parser.ts` |
| React components | `PascalCase` file + export | `ArticleCard.tsx` |
| Variables / functions | `camelCase` | `fetchArticle` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Types / Interfaces | `PascalCase` | `ArticleMetadata` |
| CSS classes | `kebab-case` | `article-card` |

### Imports

- Group imports in order: (1) Node built-ins, (2) third-party, (3) internal
  aliases (`@/...`), (4) relative paths.
- Separate each group with a blank line.
- Use absolute imports via path aliases where configured; avoid deep relative
  paths (`../../../`).

### Error Handling

- Handle errors explicitly at every async boundary.
- Provide user-friendly messages for UI-facing errors.
- Log full error context (stack, input) on the server.
- Never swallow errors silently.
- Fail fast with clear messages on invalid input.

---

## Security

Before every commit, verify:

- [ ] No hardcoded secrets, API keys, or passwords
- [ ] All user inputs validated with schema validation
- [ ] SQL queries use parameterized statements (no string interpolation)
- [ ] HTML output is sanitized (XSS prevention)
- [ ] Auth/authorization checks are in place on all endpoints
- [ ] Error messages do not leak sensitive internal data

If a security issue is found: **stop**, run the **security-reviewer** agent,
fix CRITICAL issues before continuing, and rotate any exposed secrets.

---

## Git & Commit Conventions

```
<type>: <short description>

<optional body — explain the why, not the what>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**PR workflow:**
1. Use `git diff [base-branch]...HEAD` to review all changes in the branch.
2. Write a comprehensive PR summary including a test plan.
3. Push with `git push -u origin <branch>`.
4. Create PR with `gh pr create`.

---

## Available Sub-Agents (`ecc-universal`)

Agents live in `~/.claude/agents/` (installed via `ecc-universal`).
Invoke them proactively — do not wait for the user to ask.

| Agent | When to use |
|---|---|
| `planner` | Complex features, before writing any code |
| `architect` | Architectural / system-design decisions |
| `tdd-guide` | Any new feature or bug fix (enforce TDD) |
| `code-reviewer` | After writing or modifying code |
| `security-reviewer` | Before every commit |
| `build-error-resolver` | When the build fails |
| `e2e-runner` | Critical user flows |
| `refactor-cleaner` | Dead code removal and cleanup |
| `doc-updater` | Keeping documentation current |

Run independent agents **in parallel** whenever possible to save time.

---

## OpenCode Configuration

`opencode.json` configures this project's AI session:

```json
{
  "model": "anthropic/claude-sonnet-4-5",
  "autoupdate": true,
  "plugin": ["ecc-universal"]
}
```

- Default model is **claude-sonnet-4-5** (best coding model for main work).
- Use **Haiku 4.5** for lightweight / high-frequency worker agents (3× cheaper).
- Use **Opus 4.5** for architectural decisions requiring maximum reasoning.
- Avoid operating in the last 20% of the context window for multi-file tasks;
  finish or checkpoint the work and start a fresh session.
