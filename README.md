# ghmerge

Interactive CLI tool for creating GitHub pull requests with a delightful terminal UI powered by [gum](https://github.com/charmbracelet/gum).

## Features

- 🎨 Interactive prompts for PR creation
- 📝 Smart defaults (last commit title, current branch)
- 🚀 Automatically pushes branch if not on remote
- ✨ Clean, modern terminal UI
- 🔧 Zero npm dependencies (uses system tools)

## Prerequisites

Before using `ghmerge`, you need to have the following tools installed:

1. **gum** - Provides the interactive prompts
   ```bash
   # macOS
   brew install gum

   # Linux
   # See https://github.com/charmbracelet/gum#installation
   ```

2. **gh** - GitHub CLI for creating PRs
   ```bash
   # macOS
   brew install gh

   # Linux/Windows
   # See https://cli.github.com/
   ```

3. **Authenticate with GitHub**
   ```bash
   gh auth login
   ```

## Installation

### Global Installation (Recommended)

```bash
npm install -g ghmerge
```

### Local Installation

```bash
npm install ghmerge
```

Then use with npx:
```bash
npx ghmerge
```

## Usage

### Interactive Mode

Navigate to your git repository and run:

```bash
ghmerge
```

The tool will:
1. Display your current branch as the source
2. Prompt for PR title (defaults to last commit message)
3. Prompt for PR description (optional, multiline)
4. Prompt for destination branch (defaults to "develop")
5. Push your branch to origin if not already pushed
6. Create the pull request
7. Display the PR URL

### Command-Line Options

```bash
ghmerge [OPTIONS]

OPTIONS:
  -h, --help                 Show help message
  -t, --title <text>         PR title (default: last commit message)
  -d, --description <text>   PR description (default: empty)
  -b, --base <branch>        Destination/base branch (default: develop)
  -s, --source <branch>      Source branch (default: current branch)

  --draft                    Create PR as draft
  -l, --label <label>        Add label (can be used multiple times)
  -r, --reviewer <user>      Request reviewer (can be used multiple times)
  -a, --assignee <user>      Assign PR to user (can be used multiple times)

  --dry-run                  Show what would happen without creating PR
  -v, --verbose              Show verbose output for debugging
  -w, --web                  Open PR in browser after creation
```

### Example Workflows

**Interactive mode (default):**
```bash
$ cd my-project
$ git checkout -b feature/new-feature
$ git commit -m "Add amazing feature"
$ ghmerge

📝 Create Pull Request

Source branch: feature/new-feature

# Enter PR title (pre-filled with "Add amazing feature")
# Enter description (optional)
# Enter destination branch (defaults to "develop")

Pushing branch 'feature/new-feature' to origin...

Creating pull request...

✅ Pull request created successfully!
🔗 https://github.com/user/repo/pull/123
```

**Non-interactive mode with all flags:**
```bash
$ ghmerge -t "Add new feature" -d "This adds X functionality" -b develop

Pushing branch 'feature/new-feature' to origin...

Creating pull request...

✅ Pull request created successfully!
🔗 https://github.com/user/repo/pull/124
```

**Mixed mode (some flags, some prompts):**
```bash
$ ghmerge -t "Fix critical bug" -b main
# Will only prompt for description

$ ghmerge -d "Detailed description here"
# Will prompt for title and base branch
```

**Create draft PR with labels:**
```bash
$ ghmerge --draft -l bug -l urgent -t "Fix critical issue"

Creating pull request...

✅ Pull request created successfully!
📝 Created as draft
🔗 https://github.com/user/repo/pull/125
```

**Add reviewers and assignees:**
```bash
$ ghmerge -t "New feature" -r alice -r bob -a charlie

# Requests review from alice and bob, assigns to charlie
```

**Dry run to preview:**
```bash
$ ghmerge --dry-run -t "Test PR" -b main

🔍 Dry run mode - no changes will be made

Would create PR with the following details:
  Title: Test PR
  Description: (empty)
  Source: feature/test
  Base: main

  Would push branch 'feature/test' to origin

No PR created (dry run mode)
```

**Open in browser after creation:**
```bash
$ ghmerge -t "Review this" --web
# Opens the PR in your default browser
```

**Verbose mode for debugging:**
```bash
$ ghmerge --verbose -t "Debug this"
[verbose] Starting ghmerge...
[verbose] Arguments: {...}
[verbose] Checking GitHub authentication...
[verbose] GitHub authentication verified
...
```

**Show help:**
```bash
$ ghmerge --help
```

## How It Works

1. **Smart Defaults**: Automatically uses your last commit message as the PR title
2. **Branch Detection**: Identifies your current branch as the source
3. **Auto-Push**: Pushes your branch to origin if it doesn't exist remotely
4. **PR Creation**: Uses `gh pr create` to create the pull request
5. **Success Feedback**: Shows you the PR URL immediately

## Configuration

The tool uses sensible defaults:
- **Default destination branch**: `develop`
- **Default title**: Last commit message
- **Default description**: Empty

You can override these during the interactive prompts.

## Advanced Usage

### Draft PRs
Create work-in-progress PRs that can't be merged until marked as ready:
```bash
ghmerge --draft -t "WIP: New feature"
```

### Labels
Add labels to categorize your PR (labels must exist in your repository):
```bash
ghmerge -l bug -l high-priority -l backend
```

### Reviewers and Assignees
Automatically request reviews and assign the PR:
```bash
# Request reviews from multiple people
ghmerge -r alice -r bob -r team/frontend

# Assign to someone
ghmerge -a charlie

# Combine them
ghmerge -t "Review needed" -r alice -r bob -a charlie
```

### Dry Run
Preview what would happen without actually creating the PR:
```bash
ghmerge --dry-run -t "Test" -b main --draft -l bug
```

### Verbose Mode
Debug issues by seeing detailed logging:
```bash
ghmerge --verbose
```

### Open in Browser
Automatically open the PR in your browser after creation:
```bash
ghmerge --web
```

## Troubleshooting

### "gum is not installed"
Install gum following the instructions at https://github.com/charmbracelet/gum

### "gh CLI is not installed"
Install the GitHub CLI from https://cli.github.com/

### "Not authenticated with GitHub CLI"
Run `gh auth login` to authenticate with GitHub.

### "Not in a git repository"
Make sure you're running `ghmerge` from within a git repository.

### "Not on a git branch"
You might be in a detached HEAD state. Checkout a branch first.

### Using verbose mode
If something isn't working as expected, run with `--verbose` to see detailed logs:
```bash
ghmerge --verbose
```

## Development

```bash
# Clone the repository
git clone <your-repo-url>
cd ghmerge

# Link locally for testing
npm link

# Now you can run `ghmerge` from anywhere
ghmerge

# Unlink when done
npm unlink -g ghmerge
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
