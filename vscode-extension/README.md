# BSM Development Assistant - VS Code Extension

AI-powered development assistant for real-time code analysis, test generation, documentation, and refactoring.

## Features

### 🔍 Code Analysis
- Real-time code quality analysis
- Automatic code smell detection
- Inline diagnostics in Problems panel

### 🧪 Test Generation
- Generate unit tests for JavaScript/TypeScript (Jest, Mocha)
- Generate unit tests for Python (PyTest, unittest)
- Supports multiple test frameworks

### 📝 Documentation Generation
- Generate JSDoc comments for JavaScript/TypeScript
- Generate docstrings for Python (Google style)
- Auto-document function parameters and return types

### 🔧 Code Refactoring
- Modernize legacy code
- Convert callbacks to async/await
- Apply ES6+ transformations
- Fix code smells automatically

### 🔄 Language Conversion
- Convert code between JavaScript, Python, and TypeScript
- Maintain functionality across languages
- Apply idiomatic patterns

### 💡 Code Smell Detection
- Detect long functions
- Find nested callbacks (callback hell)
- Identify magic numbers
- Highlight var usage
- Real-time inline hints

## Commands

Access via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- `BSM: Analyze Code` - Comprehensive code analysis
- `BSM: Generate Unit Tests` - Create tests for your code
- `BSM: Generate Documentation` - Add JSDoc/docstrings
- `BSM: Refactor Code` - Modernize and improve code
- `BSM: Detect Code Smells` - Find issues in your code
- `BSM: Convert to Another Language` - Translate code

## Context Menu

Right-click on selected code to access quick actions:
- Analyze Code
- Generate Tests
- Generate Documentation
- Refactor Code

## Configuration

Access settings via `File > Preferences > Settings` and search for "BSM Dev Assistant":

- `bsmDevAssistant.apiUrl` - BSM API endpoint (default: `http://localhost:3000/api/dev-assistant`)
- `bsmDevAssistant.autoAnalyze` - Auto-analyze on save (default: `false`)
- `bsmDevAssistant.showInlineHints` - Show inline code smell hints (default: `true`)
- `bsmDevAssistant.testFramework` - Preferred test framework (default: `jest`)

## Setup

1. Install the extension
2. Configure the API URL to point to your BSM instance
3. Open a JavaScript, TypeScript, or Python file
4. Start using the commands!

## Requirements

- BSM server running with the Dev Assistant agent enabled
- OpenAI API key configured on the BSM server
- VS Code 1.80.0 or higher

## Usage Examples

### Generate Tests
1. Select a function or class
2. Right-click → `BSM: Generate Unit Tests`
3. Review and save the generated tests

### Add Documentation
1. Select undocumented functions
2. Run `BSM: Generate Documentation`
3. JSDoc/docstrings added automatically

### Refactor Legacy Code
1. Select old-style code
2. Run `BSM: Refactor Code`
3. Get modern, clean code

### Detect Issues
1. Save a file (with auto-analyze enabled)
2. Check the Problems panel for code smells
3. Click on issues to navigate to them

## Extension Settings

```json
{
  "bsmDevAssistant.apiUrl": "http://localhost:3000/api/dev-assistant",
  "bsmDevAssistant.autoAnalyze": true,
  "bsmDevAssistant.showInlineHints": true,
  "bsmDevAssistant.testFramework": "jest"
}
```

## Output Channel

View detailed logs in the Output panel:
- Select "BSM Dev Assistant" from the dropdown

## Known Issues

- Large files may take longer to analyze
- Requires active internet connection to BSM server
- Code conversion works best with simple, well-structured code

## Release Notes

### 1.0.0

Initial release with:
- Code analysis and smell detection
- Unit test generation (Jest, PyTest)
- Documentation generation (JSDoc, docstrings)
- Code refactoring to modern standards
- API documentation generation
- Language conversion
- VS Code integration with inline hints

## Contributing

Visit [BSM GitHub Repository](https://github.com/MOTEB1989/BSM)

## License

MIT
