const vscode = require('vscode');
const fetch = require('node-fetch');

/**
 * BSM Development Assistant VS Code Extension
 */

let diagnosticCollection;
let outputChannel;

/**
 * Extension activation
 */
function activate(context) {
  console.log('BSM Development Assistant is now active!');

  // Create diagnostic collection for code smells
  diagnosticCollection = vscode.languages.createDiagnosticCollection('bsm-dev-assistant');
  context.subscriptions.push(diagnosticCollection);

  // Create output channel
  outputChannel = vscode.window.createOutputChannel('BSM Dev Assistant');
  context.subscriptions.push(outputChannel);

  // Register commands
  registerCommands(context);

  // Setup automatic analysis on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      const config = vscode.workspace.getConfiguration('bsmDevAssistant');
      if (config.get('autoAnalyze')) {
        analyzeDocument(document);
      }
    })
  );

  // Analyze current document on activation
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const config = vscode.workspace.getConfiguration('bsmDevAssistant');
    if (config.get('showInlineHints')) {
      analyzeDocument(editor.document);
    }
  }
}

/**
 * Register all commands
 */
function registerCommands(context) {
  // Analyze code
  context.subscriptions.push(
    vscode.commands.registerCommand('bsm-dev-assistant.analyzeCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      await analyzeCode(editor);
    })
  );

  // Generate tests
  context.subscriptions.push(
    vscode.commands.registerCommand('bsm-dev-assistant.generateTests', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      await generateTests(editor);
    })
  );

  // Generate documentation
  context.subscriptions.push(
    vscode.commands.registerCommand('bsm-dev-assistant.generateDocs', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      await generateDocumentation(editor);
    })
  );

  // Refactor code
  context.subscriptions.push(
    vscode.commands.registerCommand('bsm-dev-assistant.refactorCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      await refactorCode(editor);
    })
  );

  // Detect code smells
  context.subscriptions.push(
    vscode.commands.registerCommand('bsm-dev-assistant.detectSmells', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      await detectSmells(editor);
    })
  );

  // Convert language
  context.subscriptions.push(
    vscode.commands.registerCommand('bsm-dev-assistant.convertLanguage', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      await convertLanguage(editor);
    })
  );
}

/**
 * Get API URL from configuration
 */
function getApiUrl() {
  const config = vscode.workspace.getConfiguration('bsmDevAssistant');
  return config.get('apiUrl', 'http://localhost:3000/api/dev-assistant');
}

/**
 * Get code from editor (selection or full document)
 */
function getCode(editor) {
  const selection = editor.selection;
  if (!selection.isEmpty) {
    return editor.document.getText(selection);
  }
  return editor.document.getText();
}

/**
 * Get language from document
 */
function getLanguage(document) {
  const languageId = document.languageId;
  if (languageId === 'typescript' || languageId === 'javascript') {
    return 'javascript';
  }
  if (languageId === 'python') {
    return 'python';
  }
  return 'javascript';
}

/**
 * Analyze code
 */
async function analyzeCode(editor) {
  const code = getCode(editor);
  const language = getLanguage(editor.document);

  outputChannel.appendLine('🔍 Analyzing code...');
  vscode.window.showInformationMessage('Analyzing code...');

  try {
    const response = await fetch(`${getApiUrl()}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, filePath: editor.document.fileName })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    outputChannel.appendLine('✅ Analysis complete');
    outputChannel.appendLine(JSON.stringify(result, null, 2));

    // Show analysis in new document
    const doc = await vscode.workspace.openTextDocument({
      content: `# Code Analysis Results\n\n${result.analysis}`,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);

  } catch (error) {
    outputChannel.appendLine(`❌ Error: ${error.message}`);
    vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
  }
}

/**
 * Generate tests
 */
async function generateTests(editor) {
  const code = getCode(editor);
  const language = getLanguage(editor.document);
  const config = vscode.workspace.getConfiguration('bsmDevAssistant');
  const framework = config.get('testFramework', 'jest');

  outputChannel.appendLine('🧪 Generating tests...');
  vscode.window.showInformationMessage('Generating unit tests...');

  try {
    const response = await fetch(`${getApiUrl()}/generate-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, framework, filePath: editor.document.fileName })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    outputChannel.appendLine('✅ Tests generated');

    // Show tests in new document
    const doc = await vscode.workspace.openTextDocument({
      content: result.testCode,
      language: language === 'python' ? 'python' : 'javascript'
    });
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`Generated ${result.functionsCount} test(s) using ${framework}`);

  } catch (error) {
    outputChannel.appendLine(`❌ Error: ${error.message}`);
    vscode.window.showErrorMessage(`Test generation failed: ${error.message}`);
  }
}

/**
 * Generate documentation
 */
async function generateDocumentation(editor) {
  const code = getCode(editor);
  const language = getLanguage(editor.document);

  outputChannel.appendLine('📝 Generating documentation...');
  vscode.window.showInformationMessage('Generating documentation...');

  try {
    const response = await fetch(`${getApiUrl()}/generate-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, filePath: editor.document.fileName })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    outputChannel.appendLine('✅ Documentation generated');

    // Replace current selection or document with documented code
    const selection = editor.selection;
    const range = selection.isEmpty 
      ? new vscode.Range(0, 0, editor.document.lineCount, 0)
      : selection;

    await editor.edit(editBuilder => {
      editBuilder.replace(range, result.documentedCode);
    });

    vscode.window.showInformationMessage(`Added documentation for ${result.functionsCount} function(s)`);

  } catch (error) {
    outputChannel.appendLine(`❌ Error: ${error.message}`);
    vscode.window.showErrorMessage(`Documentation generation failed: ${error.message}`);
  }
}

/**
 * Refactor code
 */
async function refactorCode(editor) {
  const code = getCode(editor);
  const language = getLanguage(editor.document);

  outputChannel.appendLine('🔧 Refactoring code...');
  vscode.window.showInformationMessage('Refactoring code to modern standards...');

  try {
    const response = await fetch(`${getApiUrl()}/refactor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, target: 'modern', filePath: editor.document.fileName })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    outputChannel.appendLine('✅ Refactoring complete');
    outputChannel.appendLine(`Improvements: ${result.improvements.join(', ')}`);

    // Show refactored code in diff view
    const doc = await vscode.workspace.openTextDocument({
      content: result.refactoredCode,
      language: language === 'python' ? 'python' : 'javascript'
    });
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`Fixed ${result.smellsDetected} issue(s)`);

  } catch (error) {
    outputChannel.appendLine(`❌ Error: ${error.message}`);
    vscode.window.showErrorMessage(`Refactoring failed: ${error.message}`);
  }
}

/**
 * Detect code smells
 */
async function detectSmells(editor) {
  await analyzeDocument(editor.document);
  vscode.window.showInformationMessage('Code smells highlighted in the Problems panel');
}

/**
 * Analyze document and show diagnostics
 */
async function analyzeDocument(document) {
  const language = getLanguage(document);
  const code = document.getText();

  try {
    const response = await fetch(`${getApiUrl()}/detect-smells`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language })
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();

    // Create diagnostics from smells
    const diagnostics = result.smells.map(smell => {
      const line = smell.loc?.start?.line || 1;
      const range = new vscode.Range(line - 1, 0, line - 1, 100);
      
      const severity = 
        smell.severity === 'high' ? vscode.DiagnosticSeverity.Warning :
        smell.severity === 'medium' ? vscode.DiagnosticSeverity.Information :
        vscode.DiagnosticSeverity.Hint;

      return new vscode.Diagnostic(
        range,
        `[${smell.type}] ${smell.message}`,
        severity
      );
    });

    diagnosticCollection.set(document.uri, diagnostics);

  } catch (error) {
    outputChannel.appendLine(`Failed to analyze: ${error.message}`);
  }
}

/**
 * Convert language
 */
async function convertLanguage(editor) {
  const code = getCode(editor);
  const fromLang = getLanguage(editor.document);

  // Ask user for target language
  const toLang = await vscode.window.showQuickPick(
    ['javascript', 'python', 'typescript'],
    { placeHolder: 'Select target language' }
  );

  if (!toLang) {
    return;
  }

  outputChannel.appendLine(`🔄 Converting from ${fromLang} to ${toLang}...`);
  vscode.window.showInformationMessage(`Converting to ${toLang}...`);

  try {
    const response = await fetch(`${getApiUrl()}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, fromLang, toLang, filePath: editor.document.fileName })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();

    outputChannel.appendLine('✅ Conversion complete');

    // Show converted code in new document
    const doc = await vscode.workspace.openTextDocument({
      content: result.convertedCode,
      language: toLang === 'python' ? 'python' : 'javascript'
    });
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`Converted from ${fromLang} to ${toLang}`);

  } catch (error) {
    outputChannel.appendLine(`❌ Error: ${error.message}`);
    vscode.window.showErrorMessage(`Conversion failed: ${error.message}`);
  }
}

/**
 * Extension deactivation
 */
function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
  if (outputChannel) {
    outputChannel.dispose();
  }
}

module.exports = {
  activate,
  deactivate
};
