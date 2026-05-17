# Keymap Overrides

gitmag supports runtime key remapping via JSON keymap files.

## Load Order

Keymaps are loaded in this order (later entries override earlier ones):

1. Global: `$XDG_CONFIG_HOME/gitmag/keymap.json`
2. Global fallback: `~/.config/gitmag/keymap.json`
3. Repository-local: `./.gitmag/keymap.json`

Repository-local config is useful for team-shared shortcuts committed with a repo.

## File Format

Keymap files use this structure:

```json
{
  "bindings": {
    "working.toggleStage": ["+", "space"],
    "search.nextMatch": ["n"],
    "search.prevMatch": ["m"]
  }
}
```

- `bindings` is optional.
- You can override only a subset of actions.
- Any action not provided keeps the default bindings.

## Supported Tokens

Special tokens:

- `up`
- `down`
- `left`
- `right`
- `enter`
- `esc`
- `tab`
- `backspace`
- `delete`
- `space`

Printable keys are also supported directly (for example: `q`, `p`, `/`, `+`, `l`).

## Actions And Defaults

| Action ID                | Default keys          |
| ------------------------ | --------------------- |
| `quit`                   | `q`                   |
| `pick`                   | `p`                   |
| `search.open`            | `/`                   |
| `search.close`           | `esc`                 |
| `search.nextMatch`       | `n`                   |
| `search.prevMatch`       | `m`                   |
| `search.clearMatches`    | `esc`                 |
| `search.deleteChar`      | `backspace`, `delete` |
| `focus.cycle`            | `tab`                 |
| `clipboard.copySha`      | `c`                   |
| `working.toggleStage`    | `+`, `space`          |
| `navigation.up`          | `up`                  |
| `navigation.down`        | `down`                |
| `back`                   | `backspace`, `delete` |
| `select`                 | `enter`               |
| `diff.toggleLineNumbers` | `l`                   |

## Example: Vim-like Navigation

```json
{
  "bindings": {
    "navigation.up": ["k"],
    "navigation.down": ["j"],
    "back": ["h", "backspace"],
    "select": ["l", "enter"]
  }
}
```

## Notes

- Invalid or unreadable keymap files are ignored and gitmag falls back to defaults.
- Unknown keys or malformed entries are ignored per action.
- Keep at least one binding for critical actions like `quit` and `back`.
