const { execSync } = require('child_process');

// Global verbose flag
let VERBOSE = false;

/**
 * Log message if verbose mode is enabled
 * @param {string} message - Message to log
 */
function log(message) {
  if (VERBOSE) {
    console.log(`[verbose] ${message}`);
  }
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
ghmerge - Interactive CLI tool for creating GitHub pull requests

USAGE:
  ghmerge [OPTIONS]

OPTIONS:
  -h, --help                 Show this help message
  -t, --title <text>         PR title (default: last commit message)
  -d, --description <text>   PR description (default: empty)
  -b, --base <branch>        Destination/base branch (default: develop)
  -s, --source <branch>      Source branch (default: current branch)

  --draft                    Create PR as draft
  -l, --label <label>        Add label (can be used multiple times)
  -r, --reviewer <user>      Request reviewer (can be used multiple times)
  -a, --assignee <user>      Assign PR to user (can be used multiple times)

  --dry-run                  Show what would happen without creating PR
  -v, --verbose              Show verbose output
  -w, --web                  Open PR in browser after creation

EXAMPLES:
  # Interactive mode
  ghmerge

  # Non-interactive mode with all options
  ghmerge -t "Add new feature" -d "This adds X" -b develop

  # Create draft PR with labels
  ghmerge --draft -l bug -l urgent -t "Fix critical bug"

  # Add reviewers and assignees
  ghmerge -t "New feature" -r alice -r bob -a charlie

  # Dry run to preview
  ghmerge --dry-run -t "Test PR" -b main

  # Open in browser after creation
  ghmerge -t "Review this" --web

For more information, visit: https://github.com/yourusername/ghmerge
`);
}

/**
 * Parse command-line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    help: false,
    title: null,
    description: null,
    base: null,
    source: null,
    draft: false,
    labels: [],
    reviewers: [],
    assignees: [],
    dryRun: false,
    verbose: false,
    web: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        parsed.help = true;
        break;

      case '-t':
      case '--title':
        if (i + 1 < args.length) {
          parsed.title = args[++i];
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '-d':
      case '--description':
        if (i + 1 < args.length) {
          parsed.description = args[++i];
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '-b':
      case '--base':
        if (i + 1 < args.length) {
          parsed.base = args[++i];
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '-s':
      case '--source':
        if (i + 1 < args.length) {
          parsed.source = args[++i];
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '--draft':
        parsed.draft = true;
        break;

      case '-l':
      case '--label':
        if (i + 1 < args.length) {
          parsed.labels.push(args[++i]);
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '-r':
      case '--reviewer':
        if (i + 1 < args.length) {
          parsed.reviewers.push(args[++i]);
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '-a':
      case '--assignee':
        if (i + 1 < args.length) {
          parsed.assignees.push(args[++i]);
        } else {
          throw new Error(`${arg} requires a value`);
        }
        break;

      case '--dry-run':
        parsed.dryRun = true;
        break;

      case '-v':
      case '--verbose':
        parsed.verbose = true;
        break;

      case '-w':
      case '--web':
        parsed.web = true;
        break;

      default:
        throw new Error(`Unknown option: ${arg}. Use -h or --help for usage information.`);
    }
  }

  return parsed;
}

/**
 * Execute a shell command and return the output
 * @param {string} command - Command to execute
 * @param {boolean} silent - Whether to suppress stdout/stderr
 * @returns {string} - Command output
 */
function exec(command, silent = false) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    }).trim();
  } catch (error) {
    if (silent) {
      throw new Error(error.stderr?.toString().trim() || error.message);
    }
    throw error;
  }
}

/**
 * Execute a shell command and return the output (always silent)
 * @param {string} command - Command to execute
 * @returns {string} - Command output
 */
function execSilent(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
}

/**
 * Check if a command is available in PATH
 * @param {string} command - Command name to check
 * @returns {boolean}
 */
function isCommandAvailable(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated with GitHub CLI
 * @returns {boolean}
 */
function isGhAuthenticated() {
  try {
    execSilent('gh auth status');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if current directory is a git repository
 * @returns {boolean}
 */
function isGitRepo() {
  try {
    execSilent('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current git branch name
 * @returns {string}
 */
function getCurrentBranch() {
  return execSilent('git branch --show-current');
}

/**
 * Get last commit message title
 * @returns {string}
 */
function getLastCommitTitle() {
  try {
    return execSilent('git log -1 --pretty=%s');
  } catch {
    return '';
  }
}

/**
 * Check if branch exists on remote
 * @param {string} branch - Branch name
 * @returns {boolean}
 */
function isRemoteBranchExists(branch) {
  try {
    const output = execSilent(`git ls-remote --heads origin ${branch}`);
    return output.length > 0;
  } catch {
    return false;
  }
}

/**
 * Push branch to origin
 * @param {string} branch - Branch name
 */
function pushBranch(branch) {
  console.log(`\nPushing branch '${branch}' to origin...`);
  exec(`git push -u origin ${branch}`);
}

/**
 * Collect PR inputs from user using gum
 * @param {string} defaultTitle - Default PR title
 * @param {string} sourceBranch - Source branch name
 * @param {Object} prefilledValues - Pre-filled values from CLI args
 * @returns {Object} - { title, description, destBranch }
 */
function collectInputs(defaultTitle, sourceBranch, prefilledValues = {}) {
  console.log('\n📝 Create Pull Request\n');
  console.log(`Source branch: ${sourceBranch}\n`);

  // Get PR title (use prefilled or prompt)
  let title = prefilledValues.title;
  if (!title) {
    title = execSilent(
      `gum input --placeholder "PR title" --value "${defaultTitle.replace(/"/g, '\\"')}"`
    );
  }

  if (!title) {
    throw new Error('PR title is required');
  }

  // Get PR description (use prefilled or prompt)
  let description = prefilledValues.description;
  if (description === null || description === undefined) {
    console.log('\nEnter PR description (Ctrl+D to finish):');
    try {
      description = execSilent('gum write --placeholder "PR description (optional)"');
    } catch {
      // User might press Ctrl+C or just skip, that's okay
      description = '';
    }
  }

  // Get destination branch (use prefilled or prompt)
  let destBranch = prefilledValues.base;
  if (!destBranch) {
    destBranch = execSilent(
      'gum input --placeholder "Destination branch" --value "develop"'
    );
  }

  if (!destBranch) {
    throw new Error('Destination branch is required');
  }

  return { title, description, destBranch };
}

/**
 * Create PR using gh CLI
 * @param {string} title - PR title
 * @param {string} description - PR description
 * @param {string} sourceBranch - Source branch
 * @param {string} destBranch - Destination branch
 * @param {Object} options - Additional options
 * @returns {string} - PR URL
 */
function createPR(title, description, sourceBranch, destBranch, options = {}) {
  console.log('\nCreating pull request...');

  // Escape quotes in title and description
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedDescription = description.replace(/"/g, '\\"');

  // Remove 'origin/' prefix if present in destBranch
  const baseBranch = destBranch.replace(/^origin\//, '');

  // Build command
  let command = `gh pr create --base "${baseBranch}" --head "${sourceBranch}" --title "${escapedTitle}" --body "${escapedDescription}"`;

  // Add draft flag
  if (options.draft) {
    command += ' --draft';
    log('Creating as draft PR');
  }

  // Add labels
  if (options.labels && options.labels.length > 0) {
    command += ` --label "${options.labels.join(',')}"`;
    log(`Adding labels: ${options.labels.join(', ')}`);
  }

  // Add reviewers
  if (options.reviewers && options.reviewers.length > 0) {
    command += ` --reviewer "${options.reviewers.join(',')}"`;
    log(`Requesting reviewers: ${options.reviewers.join(', ')}`);
  }

  // Add assignees
  if (options.assignees && options.assignees.length > 0) {
    command += ` --assignee "${options.assignees.join(',')}"`;
    log(`Assigning to: ${options.assignees.join(', ')}`);
  }

  // Add web flag
  if (options.web) {
    command += ' --web';
    log('Will open PR in browser');
  }

  log(`Command: ${command}`);

  try {
    return execSilent(command);
  } catch (error) {
    throw new Error(`Failed to create PR: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  // Parse command-line arguments
  const args = parseArgs();

  // Set verbose mode
  VERBOSE = args.verbose;

  // Show help if requested
  if (args.help) {
    showHelp();
    return;
  }

  log('Starting ghmerge...');
  log(`Arguments: ${JSON.stringify(args, null, 2)}`);

  // Check prerequisites
  const needsGum = !args.title || !args.description || !args.base;
  if (needsGum && !isCommandAvailable('gum')) {
    throw new Error('gum is not installed. Install it from https://github.com/charmbracelet/gum');
  }

  if (!isCommandAvailable('gh')) {
    throw new Error('gh CLI is not installed. Install it from https://cli.github.com/');
  }

  log('Checking GitHub authentication...');
  if (!isGhAuthenticated()) {
    throw new Error('Not authenticated with GitHub CLI. Run: gh auth login');
  }
  log('GitHub authentication verified');

  if (!isGitRepo()) {
    throw new Error('Not in a git repository');
  }
  log('Git repository detected');

  // Get current branch (or use provided source branch)
  const sourceBranch = args.source || getCurrentBranch();
  if (!sourceBranch) {
    throw new Error('Not on a git branch');
  }
  log(`Source branch: ${sourceBranch}`);

  // Get default PR title from last commit
  const defaultTitle = getLastCommitTitle() || 'Pull Request';
  log(`Default title: ${defaultTitle}`);

  // Collect inputs (interactive or use provided args)
  const { title, description, destBranch } = collectInputs(defaultTitle, sourceBranch, args);

  log(`PR title: ${title}`);
  log(`PR description: ${description}`);
  log(`Destination branch: ${destBranch}`);

  // Dry run mode - show what would happen
  if (args.dryRun) {
    console.log('\n🔍 Dry run mode - no changes will be made\n');
    console.log('Would create PR with the following details:');
    console.log(`  Title: ${title}`);
    console.log(`  Description: ${description || '(empty)'}`);
    console.log(`  Source: ${sourceBranch}`);
    console.log(`  Base: ${destBranch}`);
    if (args.draft) console.log(`  Draft: Yes`);
    if (args.labels.length > 0) console.log(`  Labels: ${args.labels.join(', ')}`);
    if (args.reviewers.length > 0) console.log(`  Reviewers: ${args.reviewers.join(', ')}`);
    if (args.assignees.length > 0) console.log(`  Assignees: ${args.assignees.join(', ')}`);
    if (args.web) console.log(`  Open in browser: Yes`);

    if (!isRemoteBranchExists(sourceBranch)) {
      console.log(`\n  Would push branch '${sourceBranch}' to origin`);
    }

    console.log('\nNo PR created (dry run mode)\n');
    return;
  }

  // Check if remote branch exists, push if not
  if (!isRemoteBranchExists(sourceBranch)) {
    log('Remote branch does not exist, pushing...');
    pushBranch(sourceBranch);
  } else {
    console.log(`\nBranch '${sourceBranch}' already exists on remote.`);
    log('Remote branch exists, skipping push');
  }

  // Create PR
  const prUrl = createPR(title, description, sourceBranch, destBranch, {
    draft: args.draft,
    labels: args.labels,
    reviewers: args.reviewers,
    assignees: args.assignees,
    web: args.web
  });

  // Display success message
  console.log('\n✅ Pull request created successfully!');
  if (args.draft) {
    console.log('📝 Created as draft');
  }
  if (!args.web) {
    console.log(`🔗 ${prUrl}\n`);
  }
}

module.exports = { main };
