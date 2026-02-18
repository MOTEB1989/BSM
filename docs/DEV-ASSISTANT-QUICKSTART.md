# AI Development Assistant - Quick Start Guide

## What is the Development Assistant?

The AI-Powered Development Assistant is a comprehensive tool that helps developers with:

1. 🧪 **Automatic Unit Test Generation** (Jest, PyTest)
2. 📝 **JSDoc/Docstrings Documentation** generation
3. 🔧 **Legacy Code Refactoring** to modern standards
4. 📚 **API Documentation** generation (OpenAPI, Swagger)
5. 🔄 **Code Conversion** between languages (Python ↔ JavaScript)
6. 🔍 **Code Smell Detection** and refactoring suggestions
7. 🤖 **GitHub Action** that runs automatically
8. 💻 **VS Code Extension** for real-time assistance

## Quick Start

### 1. Start the BSM Server

```bash
# Install dependencies
npm ci

# Set your OpenAI API key
export OPENAI_BSU_KEY="your-api-key-here"

# Start the server
npm start
```

The server runs on `http://localhost:3000` by default.

### 2. Test the API

Generate tests for a function:

```bash
curl -X POST http://localhost:3000/api/dev-assistant/generate-tests \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "framework": "jest"
  }'
```

Detect code smells:

```bash
curl -X POST http://localhost:3000/api/dev-assistant/detect-smells \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 42; function foo() { return x * 2; }",
    "language": "javascript"
  }'
```

### 3. GitHub Action (Automatic)

The GitHub Action runs automatically on every push:

- ✅ Analyzes changed `.js`, `.ts`, `.py` files
- ✅ Detects code smells
- ✅ Checks for missing tests
- ✅ Checks for missing documentation
- ✅ Posts PR comments with suggestions

**Configuration**: `.github/workflows/dev-assistant.yml`

### 4. VS Code Extension

Install the companion VS Code extension for real-time assistance:

```bash
cd vscode-extension
npm install
npm run package
code --install-extension bsm-dev-assistant-1.0.0.vsix
```

**Configure** (VS Code settings):
```json
{
  "bsmDevAssistant.apiUrl": "http://localhost:3000/api/dev-assistant",
  "bsmDevAssistant.autoAnalyze": true,
  "bsmDevAssistant.testFramework": "jest"
}
```

**Use it**:
1. Open a JavaScript/TypeScript/Python file
2. Select code
3. Right-click → "BSM: Generate Tests" (or other commands)

## API Endpoints

All endpoints are available at `/api/dev-assistant`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Comprehensive code analysis |
| `/generate-tests` | POST | Generate unit tests |
| `/generate-docs` | POST | Generate JSDoc/docstrings |
| `/refactor` | POST | Refactor legacy code |
| `/generate-api-docs` | POST | Generate API documentation |
| `/convert` | POST | Convert code between languages |
| `/detect-smells` | POST | Detect code smells |

## Examples

### Example 1: Generate Tests

**Request**:
```json
{
  "code": "function validateEmail(email) { return /^[^@]+@[^@]+$/.test(email); }",
  "language": "javascript",
  "framework": "jest"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "functionsCount": 1,
  "testCode": "describe('validateEmail', () => { ... })",
  "framework": "jest"
}
```

### Example 2: Add Documentation

**Request**:
```json
{
  "code": "function calculate(x, y) { return x * y; }",
  "language": "javascript"
}
```

**Response**:
```json
{
  "documentedCode": "/**\n * Calculates the product of two numbers\n * @param {number} x - First number\n * @param {number} y - Second number\n * @returns {number} The product\n */\nfunction calculate(x, y) { return x * y; }"
}
```

### Example 3: Refactor Legacy Code

**Request**:
```json
{
  "code": "var getData = function(callback) { db.query(function(err, data) { callback(data); }); }",
  "language": "javascript"
}
```

**Response**:
```json
{
  "refactoredCode": "const getData = async () => { const data = await db.query(); return data; }",
  "improvements": ["var_usage", "callback_hell"]
}
```

### Example 4: Convert Python to JavaScript

**Request**:
```json
{
  "code": "def greet(name):\n    return f'Hello, {name}!'",
  "fromLang": "python",
  "toLang": "javascript"
}
```

**Response**:
```json
{
  "convertedCode": "function greet(name) {\n  return `Hello, ${name}!`;\n}"
}
```

## Features in Detail

### AST-Based Analysis

The agent uses Abstract Syntax Tree (AST) parsing for accurate code analysis:

- **Babel Parser** for JavaScript/TypeScript
- **TypeScript Compiler** for TypeScript-specific features
- **Babel Traverse** for walking the AST
- **Babel Generator** for code generation

### Code Smell Detection

Automatically detects:
- `var_usage` - Using var instead of const/let
- `long_function` - Functions over 50 lines
- `callback_hell` - Deeply nested callbacks
- `magic_number` - Unnamed numeric literals
- `complex_conditional` - Nested if statements
- `code_duplication` - Repeated code blocks

### Test Generation

Generates comprehensive tests including:
- Happy path scenarios
- Edge cases
- Error handling
- Mocked dependencies
- Supports Jest, Mocha, PyTest, unittest

### Documentation Generation

Creates professional documentation:
- **JavaScript/TypeScript**: JSDoc with @param, @returns, @throws, @example
- **Python**: Google-style docstrings
- Includes type information
- Adds usage examples

### Refactoring Capabilities

Modernizes code by:
- Converting callbacks to async/await
- Replacing var with const/let
- Applying ES6+ features (arrow functions, destructuring)
- Extracting magic numbers to constants
- Simplifying complex conditionals
- Removing code duplication

## Configuration

### Environment Variables

```bash
# Required
OPENAI_BSU_KEY=your-openai-api-key

# Optional
PORT=3000
NODE_ENV=production
```

### Agent Configuration

Edit `data/agents/dev-assistant-agent.yaml` to customize:
- Model provider (OpenAI, Anthropic, etc.)
- Model name (gpt-4o-mini, gpt-4, etc.)
- Agent instructions
- Capabilities
- Actions

### GitHub Action Configuration

Edit `.github/workflows/dev-assistant.yml` to:
- Change trigger paths
- Adjust analysis thresholds
- Customize PR comment format
- Enable/disable features

### VS Code Extension Configuration

```json
{
  "bsmDevAssistant.apiUrl": "http://localhost:3000/api/dev-assistant",
  "bsmDevAssistant.autoAnalyze": true,
  "bsmDevAssistant.showInlineHints": true,
  "bsmDevAssistant.testFramework": "jest"
}
```

## Testing

Run validation tests:
```bash
npm test
```

Test agent locally:
```bash
node test-dev-assistant.js
```

## Troubleshooting

### "API error: 401 Unauthorized"
- Check that `OPENAI_BSU_KEY` is set correctly
- Verify the API key has sufficient quota

### "Cannot find module @babel/parser"
- Run `npm ci` to install dependencies

### VS Code extension not working
- Check that the API URL is correct in settings
- Verify the BSM server is running
- Check the Output panel (select "BSM Dev Assistant")

### GitHub Action not triggering
- Check the workflow file syntax
- Verify file paths in the trigger section
- Check workflow permissions in repository settings

## Documentation

- **Full Documentation**: [docs/DEV-ASSISTANT.md](./docs/DEV-ASSISTANT.md)
- **VS Code Extension**: [vscode-extension/README.md](./vscode-extension/README.md)
- **Agent Configuration**: [data/agents/dev-assistant-agent.yaml](./data/agents/dev-assistant-agent.yaml)

## Performance

- AST parsing: ~10ms for typical files
- AI analysis: 1-5 seconds (depends on complexity)
- Code smell detection: Instant (local AST analysis)
- Test generation: 2-4 seconds
- Documentation generation: 1-3 seconds

## Limitations

- Best for JavaScript, TypeScript, Python
- Large files (>10,000 lines) may timeout
- Language conversion works best for simple code
- AI suggestions should be reviewed before applying

## Support

For issues or questions:
- Check [docs/DEV-ASSISTANT.md](./docs/DEV-ASSISTANT.md)
- Open an issue on GitHub
- Review workflow logs in GitHub Actions

## Next Steps

1. ✅ Test the API endpoints
2. ✅ Install the VS Code extension
3. ✅ Enable the GitHub Action
4. ✅ Review the full documentation
5. ✅ Start using it in your projects!

## License

MIT License - See [LICENSE](./LICENSE)
