# Clean Code Setup - Quick Start Guide

## What Was Added?

This setup adds professional code quality and formatting tools to the BSM project:

✅ **ESLint** - Catches bugs and enforces code quality  
✅ **Prettier** - Automatic code formatting  
✅ **EditorConfig** - Consistent settings across all editors  
✅ **VS Code Integration** - Format on save enabled

## Quick Commands

```bash
# Check code quality
npm run lint:eslint

# Auto-fix all issues (ESLint + Prettier)
npm run lint:fix

# Format all code
npm run format

# Check if code is formatted correctly
npm run format:check
```

## What Gets Fixed Automatically?

### Before:
```javascript
var greeting="Hello World"  // Wrong: var, double quotes, no semicolon
function add(a,b){return a+b;}  // Wrong: no spacing
const user={name:"John",age:30}  // Wrong: double quotes
```

### After:
```javascript
const greeting = 'Hello World';  // ✅ const, single quotes, semicolon
function add(a, b) {
  return a + b;
}  // ✅ Proper spacing and formatting
const user = { name: 'John', age: 30 };  // ✅ Single quotes
```

## VS Code Setup

### 1. Install Required Extensions
When you open the project, VS Code will prompt you to install:
- **ESLint** - Shows errors in real-time
- **Prettier** - Formats code automatically
- **EditorConfig** - Editor configuration

### 2. Automatic Formatting
Format-on-save is **already enabled** in `.vscode/settings.json`:
- Save any file → Automatically formatted
- ESLint issues → Auto-fixed on save (when possible)

### 3. Manual Format
- **Keyboard**: `Shift + Alt + F` (Windows/Linux) or `Shift + Option + F` (Mac)
- **Command Palette**: `Ctrl+Shift+P` → "Format Document"

## Code Quality Rules

### ✅ What's Enforced:

#### Variables
- ✅ Use `const` or `let` (never `var`)
- ✅ No unused variables (unless prefixed with `_`)

#### Style
- ✅ Single quotes for strings
- ✅ Semicolons at end of statements
- ✅ 2-space indentation
- ✅ LF line endings (Unix-style)
- ✅ Trailing commas in multi-line objects/arrays

#### Best Practices
- ✅ Use `===` instead of `==`
- ✅ No `eval()` or `new Function()`
- ✅ Prefer arrow functions for callbacks
- ✅ Proper spacing around operators

### ⚠️ What's Warned:
- Unused variables (fixable by adding `_` prefix)
- Missing documentation in some cases

## Examples

### Example 1: Variable Declaration

**Before:**
```javascript
var name = "John"
let age = 30
var unused = "test"
```

**After:**
```javascript
const name = 'John';
const age = 30;
// unused variable removed or prefixed with _
```

### Example 2: Function Style

**Before:**
```javascript
function greet(name,age){
  console.log("Hello "+name+", you are "+age)
}
```

**After:**
```javascript
function greet(name, age) {
  console.log('Hello ' + name + ', you are ' + age);
}
// Or better with template literals:
function greet(name, age) {
  console.log(`Hello ${name}, you are ${age}`);
}
```

### Example 3: Object Literals

**Before:**
```javascript
const user={
name:"John",
age:30,
  city:"Riyadh"
}
```

**After:**
```javascript
const user = {
  name: 'John',
  age: 30,
  city: 'Riyadh',
};
```

## Environment-Specific Configuration

### Node.js Files (src/, scripts/, tests/)
Automatically includes Node.js globals:
- `process`, `console`, `Buffer`, `require`, etc.
- **Example**: `src/server.js`, `scripts/validate.js`

### Browser Files (docs/, src/chat/, frontend/)
Automatically includes browser globals:
- `window`, `document`, `fetch`, `localStorage`, etc.
- Also: `Vue`, `marked` (common libraries)
- **Example**: `docs/app.js`, `src/chat/app.js`

## Integration with CI/CD

The `npm run lint` command runs:
1. ESLint checking
2. Registry validation
3. Agent configuration validation

Perfect for CI/CD pipelines!

## Troubleshooting

### ESLint Not Working?
```bash
# Check ESLint is installed
npm list eslint

# Reload VS Code
Ctrl+Shift+P → "Developer: Reload Window"
```

### Prettier Not Formatting?
1. Check VS Code settings: `Ctrl+,` → Search "format on save"
2. Ensure Prettier is set as default formatter
3. Right-click file → "Format Document With..." → Choose Prettier

### Too Many Errors?
Don't panic! Most are auto-fixable:
```bash
# Fix everything at once
npm run lint:fix
```

## Files Added

- `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to skip formatting
- `.editorconfig` - Cross-editor settings
- `docs/CLEAN-CODE-SETUP.md` - Full documentation

## Files Modified

- `package.json` - Added lint scripts
- `.vscode/settings.json` - Enabled format-on-save
- `CLAUDE.md` - Updated with code quality section

## Before Committing

```bash
# 1. Format your code
npm run format

# 2. Fix any linting issues
npm run lint:fix

# 3. Check if everything passes
npm run lint
```

## Learn More

- Full documentation: `docs/CLEAN-CODE-SETUP.md`
- ESLint rules: `eslint.config.js`
- Prettier config: `.prettierrc`
- VS Code settings: `.vscode/settings.json`

---

**Status**: ✅ Clean code tooling is ready to use!  
**Questions?** Check `docs/CLEAN-CODE-SETUP.md` for detailed information.
