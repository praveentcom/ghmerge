# CLAUDE.md

## Project Overview

**ghmerge** is an interactive CLI tool for creating GitHub pull requests with a terminal UI powered by [gum](https://github.com/charmbracelet/gum). It wraps the `gh` CLI to provide a streamlined, interactive PR creation workflow.

- **npm package**: `ghmerge` (v1.3.3)
- **License**: MIT
- **Node.js requirement**: >=14.0.0
- **Repository**: https://github.com/praveentcom/ghmerge

## Codebase Structure

```
ghmerge/
├── bin/
│   └── ghmerge.js          # CLI entry point (shebang script, requires lib/index.js)
├── lib/
│   └── index.js            # All application logic (single-file architecture)
├── .github/
│   └── workflows/
│       └── publish.yml     # GitHub Actions: auto-publish to npm on version bump
├── package.json            # Package config, bin mapping, no dependencies
├── README.md               # User-facing documentation
└── CLAUDE.md               # This file
```

### Key architectural points

- **Zero dependencies**: The project has no npm dependencies. It relies solely on Node.js built-ins (`child_process`).
- **Single-file logic**: All application logic lives in `lib/index.js` (~570 lines). The bin script is a thin wrapper.
- **External tool dependencies**: Requires `gum` (interactive prompts) and `gh` (GitHub CLI) to be installed on the user's system.
- **Synchronous execution**: Uses `execSync` throughout — no async I/O for shell commands despite `main()` being async.

## Code Architecture (lib/index.js)

The file is organized as follows:

| Function | Purpose |
|---|---|
| `log()` | Conditional verbose logging (controlled by global `VERBOSE` flag) |
| `showHelp()` | Prints CLI usage/help text |
| `parseArgs()` | Manual argument parser (no library, handles all CLI flags) |
| `exec()` / `execSilent()` | Shell command execution wrappers around `execSync` |
| `isCommandAvailable()` | Checks if a command exists in PATH via `which` |
| `isGhAuthenticated()` | Validates `gh auth status` |
| `isGitRepo()` | Checks `git rev-parse --git-dir` |
| `getCurrentBranch()` | Returns current branch via `git branch --show-current` |
| `getLastCommitTitle()` | Gets last commit message for default PR title |
| `isRemoteBranchExists()` | Checks `git ls-remote --heads` for branch existence |
| `pushBranch()` | Pushes branch to origin |
| `collectInputs()` | Gathers PR details interactively via `gum` or uses CLI args |
| `createPR()` | Builds and executes `gh pr create` command |
| `main()` | Orchestrates the full workflow |

### Main workflow (`main()`)

1. Parse CLI arguments
2. Check prerequisites (gum, gh, authentication, git repo)
3. Determine source branch
4. Collect PR inputs (interactive or from flags)
5. Handle dry-run mode if enabled
6. Push branch to origin
7. Create PR via `gh pr create`
8. Optionally open PR in browser

## Development Setup

```bash
# Clone and link for local testing
git clone https://github.com/praveentcom/ghmerge.git
cd ghmerge
npm link

# Run the tool
ghmerge

# Unlink when done
npm unlink -g ghmerge
```

## Build & Test Commands

- **There is no build step.** The project is plain CommonJS JavaScript with no transpilation.
- **There are no tests.** `npm test` is a placeholder that exits with an error (`echo "Error: no test specified" && exit 1`).
- **No linter or formatter is configured.**

## CI/CD

The GitHub Actions workflow (`.github/workflows/publish.yml`) auto-publishes to npm when:
- A push lands on `main`
- `package.json` was modified
- The version in `package.json` doesn't already exist on npm

It also creates a GitHub Release with the version tag.

## Conventions

- **Branching**: The default base branch for PRs is `main`. The tool defaults to `develop` as the PR destination branch.
- **Commit style**: Short imperative messages (e.g., "Fix -o flag to open PR after creation", "Add interactive prompts for draft, labels, reviewers, and assignees").
- **Code style**: CommonJS modules (`require`/`module.exports`), JSDoc comments on all functions, no semicolons are inconsistent (semicolons are used). Standard JS formatting with 2-space indentation.
- **Error handling**: Errors throw with descriptive messages; the bin entry point catches and logs them with `process.exit(1)`.
- **No external dependencies**: Keep the project dependency-free. Use Node.js built-ins only.

## CLI Flags Reference

| Flag | Short | Description |
|---|---|---|
| `--help` | `-h` | Show help |
| `--title` | `-t` | PR title (default: last commit message) |
| `--description` | `-d` | PR description |
| `--base` | `-b` | Destination branch (default: develop) |
| `--source` | `-s` | Source branch (default: current branch) |
| `--draft` | — | Create as draft PR |
| `--label` | `-l` | Add label (repeatable) |
| `--reviewer` | `-r` | Request reviewer (repeatable) |
| `--assignee` | `-a` | Assign user (repeatable) |
| `--dry-run` | — | Preview without creating PR |
| `--verbose` | `-v` | Enable verbose logging |
| `--web` | `-o`, `-w` | Open PR in browser after creation |

## Important Notes for AI Assistants

- The argument parser is hand-written (no yargs/commander). When adding new flags, follow the existing `switch/case` pattern in `parseArgs()`.
- `gum` is only required when running in interactive mode (i.e., when `--title` and `--base` are not both provided via CLI flags).
- Shell commands are built via string concatenation. Be cautious about injection — user inputs for title/description are escaped with `replace(/"/g, '\\"')` but this is limited.
- The `VERBOSE` flag is a module-level global, not passed as a parameter.
- All file paths in `package.json` `bin` use `./bin/ghmerge.js` — the shebang `#!/usr/bin/env node` makes it executable.
