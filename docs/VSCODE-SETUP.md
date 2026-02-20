# VS Code Development Setup

This guide provides comprehensive instructions for setting up Visual Studio Code for BSM/BSU platform development.

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) installed
- Node.js 22+ (as per `.nvmrc`)
- Git configured with GitHub credentials

## Recommended Extensions

The project includes a `.vscode/extensions.json` file that will prompt you to install recommended extensions when you open the project.

### Core Extensions

#### [GitHub Pull Requests and Issues](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github)
**Why:** Manage pull requests and issues directly from VS Code without switching to the browser.

**Features:**
- Browse, review, and comment on PRs
- Create and manage issues
- View PR status and checks
- Merge PRs with single click
- Browse repository files at specific commits

**Usage:**
1. Authenticate with GitHub (prompted on first use)
2. Access via Activity Bar (GitHub icon) or Command Palette (`Ctrl+Shift+P` > "GitHub")
3. View open PRs in the sidebar
4. Review code changes with inline comments

#### [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
**Why:** AI-powered code completion and suggestions aligned with project patterns.

**Features:**
- Intelligent code completion
- Context-aware suggestions
- Multi-line code generation
- Pattern recognition from codebase

**Note:** Requires GitHub Copilot subscription (included in Copilot Pro)

#### [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat)
**Why:** Conversational AI assistance for debugging, refactoring, and understanding code.

**Features:**
- Ask questions about code
- Generate tests
- Explain complex logic
- Refactoring suggestions

### Code Quality Extensions

#### ESLint
Linting for JavaScript/TypeScript to maintain code quality standards.

#### Prettier
Code formatting (disabled by default to avoid conflicts with project style).

#### YAML
YAML language support with schema validation for agent configurations and GitHub workflows.

### Utility Extensions

#### Path Intellisense
Autocomplete for file paths in imports and requires.

#### Code Spell Checker
Catch typos in code, comments, and documentation.

#### Docker
Manage Docker containers, images, and compose files.

#### EditorConfig
Ensures consistent coding styles across different editors.

## VS Code Configuration

The project includes pre-configured settings in `.vscode/settings.json`:

- **Tab Size**: 2 spaces
- **EOL**: LF (Unix-style)
- **Trim Trailing Whitespace**: Enabled
- **Insert Final Newline**: Enabled
- **Quote Style**: Single quotes for JavaScript/TypeScript

## Available Tasks

Run tasks via `Terminal > Run Task` or `Ctrl+Shift+B`:

- **Start Development Server** - Launch dev server with auto-reload
- **Run Validation** - Validate agents and registry
- **Run Health Check** - Quick health check
- **Run Detailed Health Check** - Comprehensive system check
- **Run PR Check** - Local PR governance validation
- **Run All Tests** - Execute test suite

## Debug Configurations

Launch configurations available via `Run and Debug` panel (`Ctrl+Shift+D`):

1. **Launch Server** - Start server with debugger attached
2. **Run Validation** - Debug validation scripts
3. **Run Health Check** - Debug health check scripts
4. **Attach to Process** - Attach debugger to running Node.js process

## Quick Start

1. **Clone and open the repository:**
   ```bash
   git clone https://github.com/LexBANK/BSM.git
   cd BSM
   code .
   ```

2. **Install recommended extensions** when prompted

3. **Install dependencies:**
   ```bash
   npm ci
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development:**
   - Press `F5` to launch server with debugger
   - Or run task: `Terminal > Run Task > Start Development Server`
   - Or use terminal: `npm run dev`

## GitHub PR Extension Workflow

### Reviewing Pull Requests

1. **Open GitHub view** in Activity Bar
2. **Browse PRs** under "Pull Requests" section
3. **Click a PR** to view details
4. **Review changes:**
   - Click "Description" to see PR details
   - Click "Changes" to see file diffs
   - Add comments by clicking line numbers
5. **Approve or Request Changes** using top-right buttons
6. **Merge PR** when ready

### Creating Pull Requests

1. **Make changes** and commit to feature branch
2. **Push branch** to GitHub
3. **Open GitHub view** in Activity Bar
4. **Click "Create Pull Request"** button
5. **Fill in details** and create PR

### Managing Issues

1. **Browse issues** in GitHub view
2. **Filter by labels, assignee, or milestone**
3. **Create new issues** with "+" button
4. **View issue details** and add comments

## Keyboard Shortcuts

### GitHub PR Extension
- `Ctrl+Shift+P` > "GitHub" - Show all GitHub commands
- `Ctrl+Shift+P` > "PR: Checkout Pull Request" - Checkout PR locally

### General Development
- `F5` - Start debugging
- `Ctrl+Shift+B` - Run build/task
- `Ctrl+` `` ` `` - Toggle terminal
- `Ctrl+Shift+E` - Explorer view
- `Ctrl+Shift+G` - Source Control view
- `Ctrl+Shift+D` - Debug view

## Tips and Best Practices

### Working with Pull Requests

1. **Always review CI/CD status** in PR view before merging
2. **Use inline comments** for specific code feedback
3. **Test locally** by checking out PR branch (`Ctrl+Shift+P` > "PR: Checkout")
4. **Follow BSM governance checklist** (run `npm run pr-check` locally)

### Code Quality

1. **Fix linting errors** before committing
2. **Use Copilot suggestions** but review them carefully
3. **Run validation** before pushing (`npm run validate`)
4. **Check health** after changes (`npm run health:detailed`)

### Debugging

1. **Set breakpoints** by clicking line numbers
2. **Use Debug Console** for REPL during debugging
3. **Inspect variables** in Debug sidebar
4. **Use Logpoints** (right-click line number) for non-intrusive logging

## Troubleshooting

### Extensions Not Installing

**Solution:** Install manually via Extensions view (`Ctrl+Shift+X`) or:
```bash
code --install-extension github.vscode-pull-request-github
```

### GitHub Authentication Issues

**Solution:** 
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "GitHub: Sign in to GitHub"
3. Follow authentication flow

### PR Extension Not Loading

**Solution:**
1. Check GitHub authentication status
2. Reload window (`Ctrl+Shift+P` > "Reload Window")
3. Check extension output for errors

## Additional Resources

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [GitHub PR Extension Guide](https://github.com/Microsoft/vscode-pull-request-github)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [BSM Documentation](./README.md)
- [BSM Governance](./GOVERNANCE.md)
- [BSM Security](./SECURITY.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/LexBANK/BSM/issues
- Telegram Bot: https://t.me/LexFixBot
- Documentation: [docs/](./docs/)
