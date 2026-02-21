# Clean Code Setup Guide

This document describes the clean code tooling and practices configured for the BSM project.

## Overview

The project uses ESLint and Prettier to enforce consistent code quality and formatting across the codebase. These tools integrate seamlessly with VS Code for real-time feedback and automatic formatting.

## Tools Installed

### ESLint
- **Version**: Latest (flat config format)
- **Purpose**: Code quality and potential error detection
- **Configuration**: `eslint.config.js`

### Prettier
- **Version**: Latest
- **Purpose**: Code formatting
- **Configuration**: `.prettierrc`

### EditorConfig
- **Purpose**: Basic editor settings across different IDEs
- **Configuration**: `.editorconfig`

## Configuration Files

### `eslint.config.js`
Modern flat config format with separate configurations for:
- **Node.js files**: `src/`, `scripts/`, `mcp-servers/`
- **Browser files**: `docs/`, `src/chat/`, `src/admin/`, `frontend/`
- **ES Modules**: `**/*.mjs` files

### `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `.editorconfig`
Universal editor settings:
- UTF-8 encoding
- LF line endings
- 2-space indentation for JS/TS/JSON/YAML
- Trim trailing whitespace
- Insert final newline

## NPM Scripts

```bash
# Lint JavaScript/TypeScript code
npm run lint:eslint

# Fix auto-fixable linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check

# Full lint (ESLint + registry validation)
npm run lint
```

## VS Code Integration

### Required Extensions
1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier** (`esbenp.prettier-vscode`)
3. **EditorConfig** (`editorconfig.editorconfig`)

These are already listed in `.vscode/extensions.json` and will be suggested when you open the project.

### Automatic Formatting
The workspace settings (`.vscode/settings.json`) are configured to:
- Format on save using Prettier
- Auto-fix ESLint issues on save
- Use single quotes for JavaScript/TypeScript
- Use 2-space indentation
- Use LF line endings

## Code Quality Rules

### ESLint Rules
- **No unused variables** (warns, allows `_` prefix)
- **No console** (off for Node.js, allowed)
- **Prefer const** over let/var
- **Prefer arrow functions** for callbacks
- **Strict equality** (`===` instead of `==`)
- **No eval** or Function constructor
- **ES6+ features** encouraged

### Security Rules
- No `eval()`
- No `new Function()`
- No implied eval

## Ignored Files

### `.prettierignore`
- `node_modules/`
- `dist/`, `build/`, `coverage/`
- `reports/`, `report/`
- `*.json`, `*.yaml`, `*.yml` (to preserve specific formatting)
- `*.md` (to preserve manual formatting)
- Lock files

### ESLint Ignores (in `eslint.config.js`)
- `node_modules/**`
- `dist/**`, `build/**`
- `coverage/**`
- `*.min.js`
- `reports/**`, `report/**`
- `.git/**`

## Usage Examples

### Check Specific File
```bash
npx eslint src/server.js
```

### Fix Specific File
```bash
npx eslint src/server.js --fix
npx prettier --write src/server.js
```

### Check All Files
```bash
npm run lint:eslint
```

### Fix All Auto-Fixable Issues
```bash
npm run lint:fix
```

### Format All Code
```bash
npm run format
```

## Workflow Integration

### Pre-commit Hooks
Consider adding a pre-commit hook to ensure code quality:
```bash
# In .githooks/pre-commit
npm run lint:eslint
npm run format:check
```

### CI/CD Integration
The `npm run lint` command is perfect for CI/CD pipelines as it includes:
1. ESLint checking
2. Registry validation
3. Agent configuration validation

## Best Practices

1. **Run format before committing**: `npm run format`
2. **Fix linting issues**: `npm run lint:fix`
3. **Use VS Code auto-format**: Save files to auto-format
4. **Check CI feedback**: Address any linting failures in CI

## Troubleshooting

### ESLint Not Working in VS Code
1. Ensure ESLint extension is installed
2. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check output: View → Output → Select "ESLint" from dropdown

### Prettier Not Formatting
1. Ensure Prettier extension is installed
2. Check default formatter: File → Preferences → Settings → "Default Formatter"
3. Verify "Format On Save" is enabled

### Conflicting Rules
Prettier and ESLint are configured to work together via `eslint-config-prettier`, which disables ESLint formatting rules that conflict with Prettier.

## Environment-Specific Globals

### Node.js Files
Automatically includes: `process`, `Buffer`, `console`, `require`, etc.

### Browser Files
Automatically includes: `window`, `document`, `fetch`, `localStorage`, `Vue`, `marked`, etc.

### MJS Files
Automatically includes: `URL`, `URLSearchParams`, etc.

## Maintenance

### Updating Dependencies
```bash
npm update eslint prettier eslint-config-prettier eslint-plugin-prettier
```

### Adding New Rules
Edit `eslint.config.js` and add rules to the appropriate configuration object.

### Excluding Files
Add patterns to the `ignores` array in `eslint.config.js` or to `.prettierignore`.

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [EditorConfig Documentation](https://editorconfig.org/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)

---

**Status**: Clean code tooling is fully configured and ready to use.
**Last Updated**: 2026-02-21
