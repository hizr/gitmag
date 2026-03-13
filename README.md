# Git Magazine

A terminal-based interactive TUI that scans the current directory for Git
repositories and presents a digest of all activity since the last run.
Think of it as a daily developer briefing for what changed across your local
projects.

```
╔══════════════════════════════════════════════════════════════════╗
║  Git Magazine  —  Mar 13, 2026  —  last 24h  —  4 active repos  ║
╚══════════════════════════════════════════════════════════════════╝

  Repos

  > my-api          +23 commits  3 authors
    frontend-app    +8 commits   2 authors
    shared-lib      +2 commits   1 author
    infra            +1 commit   1 author

  ↑↓ navigate  Enter select  q quit
```

---

## Install

Requires **Node.js >= 20**.

```bash
git clone <repo-url> gitmag
cd gitmag
npm install
npm run build
npm install -g .
```

After that, `gitmag` is available anywhere on your `PATH`.

---

## Start

Run from any directory — gitmag always scans from the current working
directory:

```bash
gitmag
```

During development you can skip the build step with:

```bash
npm run dev
```

---

## Usage

```
gitmag [options]
```

| Option               | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `--depth <n>`        | How many directory levels to scan (default: `3`)        |
| `--since <duration>` | Override the time window — e.g. `1h`, `12h`, `7d`, `2w` |
| `--all`              | Include repos with no activity in the time window       |
| `--json`             | Skip the TUI and print structured JSON to stdout        |
| `--schema`           | Print the OpenAPI 3.x JSON schema for `--json` output   |
| `--schema --yaml`    | Same schema, printed as YAML                            |
| `--reset`            | Clear all saved state and start fresh                   |

### Time window

By default gitmag remembers when it last ran and shows everything since
then, with a **minimum floor of 24 hours** — so even if you run it twice in
the same day you still see the full last day of activity.

`--since` overrides this freely in either direction:

```bash
gitmag --since 1h    # just the last hour
gitmag --since 7d    # last week
gitmag --since 2w    # last two weeks
```

### Navigation

```
Level 1 — Repository list
  ↑ / ↓      move selection
  Enter      drill into repo
  q          quit

Level 2 — Author list (per repo)
  ↑ / ↓      move selection
  Enter      drill into author
  Esc / q    back to repos

Level 3 — Commit list (per author)
  > feat: add user auth  (3h ago)
      ├── src/auth/login.ts      +45 -3
      ├── src/auth/middleware.ts +12 -0
      └── tests/auth.test.ts    +30 -1

  ↑ / ↓      move between commits and files
  Enter      open diff for highlighted file
  Esc / q    back to authors

Level 4 — Side-by-side diff view
  OLD                          │  NEW
  1  const y = 2;              │  1  const y = 99;
  2                            │  2  const z = 3;
  3  export {};                │  3  export {};

  ↑ / ↓      scroll line by line
  PgUp/PgDn  scroll 20 lines at a time
  Esc / q    back to commit list
```

### JSON output

```bash
gitmag --json | jq '.repositories[].name'
```

```json
{
  "scanDirectory": "/home/user/projects",
  "timeWindow": { "from": "2026-03-12T10:00:00Z", "to": "2026-03-13T10:00:00Z" },
  "repositories": [
    {
      "path": "/home/user/projects/my-api",
      "name": "my-api",
      "authors": [
        {
          "name": "Alice Chen",
          "email": "alice@example.com",
          "commits": [
            {
              "hash": "abc123f",
              "message": "feat: add user auth",
              "date": "2026-03-13T09:15:00Z",
              "files": [
                { "path": "src/auth/login.ts", "additions": 45, "deletions": 3, "binary": false }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Print the full schema:

```bash
gitmag --schema          # JSON
gitmag --schema --yaml   # YAML
```

---

## Build

```bash
# Compile TypeScript to dist/
npm run build

# Type-check without emitting output
npm run typecheck

# Run all tests
npm test

# Lint
npm run lint

# Format
npm run format
```

Output is written to `dist/`. The `bin` field in `package.json` points to
`dist/cli.js`, so `npm install -g .` picks it up automatically after a build.
