# AI-Powered Development Assistant

## Overview

The BSM Development Assistant is an AI-powered tool that helps developers with automated code analysis, test generation, documentation, refactoring, and code conversion. It leverages AST parsing (Babel, TypeScript compiler) and OpenAI's GPT models to provide intelligent code assistance.

## Features

### 1. Automatic Unit Test Generation

Generate comprehensive unit tests for JavaScript/TypeScript (Jest) and Python (PyTest).

**Endpoint**: `POST /api/dev-assistant/generate-tests`

**Request Body**:
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "framework": "jest",
  "filePath": "src/utils.js"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "filePath": "src/utils.js",
  "language": "javascript",
  "framework": "jest",
  "functionsCount": 1,
  "testCode": "describe('add', () => { ... })",
  "modelUsed": "gpt-4o-mini",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Features**:
- Happy path scenarios
- Edge cases
- Error handling
- Mock external dependencies

### 2. JSDoc/Docstrings Documentation

Generate comprehensive documentation for functions and methods.

**Endpoint**: `POST /api/dev-assistant/generate-docs`

**Request Body**:
```json
{
  "code": "function calculate(x, y) { return x * y; }",
  "language": "javascript",
  "style": "jsdoc",
  "filePath": "src/math.js"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "filePath": "src/math.js",
  "language": "javascript",
  "style": "JSDoc",
  "functionsCount": 1,
  "documentedCode": "/**\n * Calculates the product...\n */\nfunction calculate(x, y) { ... }",
  "modelUsed": "gpt-4o-mini",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Documentation Style**:
- **JavaScript/TypeScript**: JSDoc with @param, @returns, @throws, @example
- **Python**: Google-style docstrings

### 3. Legacy Code Refactoring

Modernize legacy code to current standards.

**Endpoint**: `POST /api/dev-assistant/refactor`

**Request Body**:
```json
{
  "code": "var x = function(cb) { setTimeout(function() { cb(null, 'done'); }, 100); }",
  "language": "javascript",
  "target": "modern",
  "filePath": "src/legacy.js"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "filePath": "src/legacy.js",
  "language": "javascript",
  "target": "modern",
  "smellsDetected": 3,
  "refactoredCode": "const x = async () => { ... }",
  "improvements": ["var_usage", "callback_hell"],
  "modelUsed": "gpt-4o-mini",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Transformations**:
- Callbacks → Promises/async-await
- var → const/let
- ES6+ features (arrow functions, destructuring, spread)
- Extract magic numbers
- Simplify complex conditionals

### 4. API Documentation Generation

Generate OpenAPI/Swagger documentation from Express routes.

**Endpoint**: `POST /api/dev-assistant/generate-api-docs`

**Request Body**:
```json
{
  "code": "router.get('/users/:id', async (req, res) => { ... })",
  "format": "openapi",
  "filePath": "src/routes/users.js"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "filePath": "src/routes/users.js",
  "format": "openapi",
  "routesCount": 1,
  "documentation": "openapi: 3.0.0\npaths:\n  /users/{id}:\n    get: ...",
  "routes": [{"method": "GET", "path": "/users/:id"}],
  "modelUsed": "gpt-4o-mini",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Formats**:
- OpenAPI 3.0 (YAML)
- Markdown

### 5. Language Conversion

Convert code between programming languages.

**Endpoint**: `POST /api/dev-assistant/convert`

**Request Body**:
```json
{
  "code": "def greet(name): return f'Hello, {name}!'",
  "fromLang": "python",
  "toLang": "javascript",
  "filePath": "utils.py"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "filePath": "utils.py",
  "fromLang": "python",
  "toLang": "javascript",
  "convertedCode": "function greet(name) { return `Hello, ${name}!`; }",
  "modelUsed": "gpt-4o-mini",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Supported Languages**:
- Python ↔ JavaScript
- Python ↔ TypeScript
- JavaScript ↔ TypeScript

### 6. Code Smell Detection

Detect anti-patterns and code smells using AST analysis.

**Endpoint**: `POST /api/dev-assistant/detect-smells`

**Request Body**:
```json
{
  "code": "var x = 42; function foo() { ... }",
  "language": "javascript"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "language": "javascript",
  "smellsCount": 2,
  "smells": [
    {
      "type": "var_usage",
      "severity": "medium",
      "message": "Use const or let instead of var",
      "loc": {"start": {"line": 1, "column": 0}}
    },
    {
      "type": "magic_number",
      "severity": "low",
      "message": "Magic number 42 should be a named constant",
      "loc": {"start": {"line": 1, "column": 8}}
    }
  ],
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

**Detected Smells**:
- `var_usage` - Using var instead of const/let
- `long_function` - Functions over 50 lines
- `callback_hell` - Deeply nested callbacks
- `magic_number` - Unnamed numeric literals
- `complex_conditional` - Nested if statements
- `code_duplication` - Repeated code blocks

### 7. Comprehensive Code Analysis

Full code analysis with quality scoring.

**Endpoint**: `POST /api/dev-assistant/analyze`

**Request Body**:
```json
{
  "code": "function processUser(user) { ... }",
  "language": "javascript",
  "filePath": "src/user.js"
}
```

**Response**:
```json
{
  "agentId": "dev-assistant-agent",
  "filePath": "src/user.js",
  "language": "javascript",
  "functionsCount": 1,
  "smellsCount": 0,
  "smells": [],
  "analysis": "{\n  \"score\": 8,\n  \"complexity\": \"medium\",\n  \"suggestions\": [...]\n}",
  "modelUsed": "gpt-4o-mini",
  "timestamp": "2026-02-18T21:00:00.000Z"
}
```

## Architecture

### Agent Structure

```
src/agents/DevAssistantAgent.js       # Main agent implementation
data/agents/dev-assistant-agent.yaml  # Agent configuration
src/controllers/devAssistantControl.js # API controllers
src/routes/devAssistant.js            # API routes
```

### AST Parsing

The agent uses:
- **@babel/parser** - Parse JavaScript/TypeScript to AST
- **@babel/traverse** - Walk and analyze AST nodes
- **@babel/generator** - Generate code from AST
- **typescript** - Parse TypeScript files

### AI Integration

Uses `modelRouter` from BSM's model routing system:
- Routes requests to appropriate AI models
- Handles complexity-based model selection
- Supports OpenAI GPT-4o-mini by default

## GitHub Action Integration

The workflow automatically runs on every push:

**Workflow**: `.github/workflows/dev-assistant.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to `**.js`, `**.ts`, `**.py` files

**Actions**:
1. Analyze changed files for code smells
2. Check for missing unit tests
3. Check for missing documentation
4. Post PR comments with suggestions

**Example PR Comment**:
```markdown
## 🤖 AI Development Assistant Analysis

Found **3** potential improvement(s) in the changed files:

### 📄 `src/utils.js` (2 issue(s))

🟡 **var_usage** (medium)
   Use const or let instead of var
   _Line 10_

🟢 **magic_number** (low)
   Magic number 100 should be a named constant
   _Line 15_
```

## VS Code Extension

The companion VS Code extension provides real-time assistance:

**Location**: `vscode-extension/`

**Features**:
- Real-time code smell detection
- Inline diagnostics in Problems panel
- Context menu integration
- Command palette commands
- Auto-analyze on save

**Installation**:
```bash
cd vscode-extension
npm install
npm run package
code --install-extension bsm-dev-assistant-1.0.0.vsix
```

**Configuration** (in VS Code settings):
```json
{
  "bsmDevAssistant.apiUrl": "http://localhost:3000/api/dev-assistant",
  "bsmDevAssistant.autoAnalyze": true,
  "bsmDevAssistant.showInlineHints": true,
  "bsmDevAssistant.testFramework": "jest"
}
```

## Usage Examples

### Example 1: Generate Tests via API

```bash
curl -X POST http://localhost:3000/api/dev-assistant/generate-tests \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function validateEmail(email) { return /^[^@]+@[^@]+$/.test(email); }",
    "language": "javascript",
    "framework": "jest"
  }'
```

### Example 2: Refactor Legacy Code

```bash
curl -X POST http://localhost:3000/api/dev-assistant/refactor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var getData = function(id, callback) { db.query(id, function(err, data) { if (err) { callback(err); } else { callback(null, data); } }); }",
    "language": "javascript",
    "target": "modern"
  }'
```

### Example 3: Convert Python to JavaScript

```bash
curl -X POST http://localhost:3000/api/dev-assistant/convert \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def calculate_total(items):\n    return sum(item.price for item in items)",
    "fromLang": "python",
    "toLang": "javascript"
  }'
```

## Testing

Run validation tests:
```bash
npm test
```

Test the agent programmatically:
```javascript
import { devAssistantAgent } from './src/agents/DevAssistantAgent.js';

// Detect code smells
const smells = devAssistantAgent.detectCodeSmells(code, 'javascript');
console.log(smells);

// Extract functions
const functions = devAssistantAgent.extractFunctions(code, 'javascript');
console.log(functions);
```

## Security Considerations

- API endpoints are rate-limited (100 req/15 min)
- OpenAI API key required (set `OPENAI_BSU_KEY` env variable)
- Code is never stored permanently
- AST parsing happens locally, AI only for suggestions

## Performance

- AST parsing: ~10ms for typical files
- AI analysis: 1-5 seconds depending on complexity
- Code smell detection: Instant (local AST analysis)
- Test generation: 2-4 seconds
- Documentation generation: 1-3 seconds

## Limitations

- Best for JavaScript, TypeScript, Python
- Large files (>10,000 lines) may timeout
- Language conversion works best for simple code
- AI suggestions require review before applying

## Roadmap

Future enhancements:
- [ ] Support for more languages (Java, Go, Ruby)
- [ ] Integration with more test frameworks
- [ ] Custom refactoring rules
- [ ] Code complexity metrics
- [ ] Performance profiling suggestions
- [ ] Security vulnerability detection
- [ ] Automated PR creation with fixes

## Contributing

See the main [BSM README](../README.md) for contribution guidelines.

## License

MIT License - See [LICENSE](../LICENSE)
