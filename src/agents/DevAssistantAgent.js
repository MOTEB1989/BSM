import * as babel from "@babel/core";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as ts from "typescript";
import { modelRouter } from "../config/modelRouter.js";
import logger from "../utils/logger.js";

/**
 * AI-Powered Development Assistant Agent
 * Handles: test generation, documentation, refactoring, code conversion, smell detection
 */
export class DevAssistantAgent {
  constructor() {
    this.id = "dev-assistant-agent";
    this.name = "Development Assistant";
    this.version = "1.0.0";
  }

  /**
   * Parse JavaScript/TypeScript code into AST
   */
  parseJavaScript(code, options = {}) {
    try {
      return parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
        ...options
      });
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] JavaScript parse failed`);
      throw error;
    }
  }

  /**
   * Parse TypeScript code
   */
  parseTypeScript(code) {
    try {
      return ts.createSourceFile(
        "temp.ts",
        code,
        ts.ScriptTarget.Latest,
        true
      );
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] TypeScript parse failed`);
      throw error;
    }
  }

  /**
   * Extract functions from code for analysis
   */
  extractFunctions(code, language = "javascript") {
    const functions = [];
    
    if (language === "javascript" || language === "typescript") {
      const ast = this.parseJavaScript(code);
      
      traverse.default(ast, {
        FunctionDeclaration(path) {
          functions.push({
            type: "function",
            name: path.node.id?.name || "anonymous",
            params: path.node.params.map(p => p.name || "param"),
            code: generate.default(path.node).code,
            loc: path.node.loc
          });
        },
        ArrowFunctionExpression(path) {
          const parent = path.parent;
          const name = parent.type === "VariableDeclarator" ? parent.id.name : "anonymous";
          functions.push({
            type: "arrow",
            name,
            params: path.node.params.map(p => p.name || "param"),
            code: generate.default(path.node).code,
            loc: path.node.loc
          });
        },
        ClassMethod(path) {
          functions.push({
            type: "method",
            name: path.node.key.name || "anonymous",
            params: path.node.params.map(p => p.name || "param"),
            code: generate.default(path.node).code,
            loc: path.node.loc,
            isAsync: path.node.async,
            isStatic: path.node.static
          });
        }
      });
    }
    
    return functions;
  }

  /**
   * Generate unit tests for code (Jest)
   */
  async generateTests(payload = {}) {
    const { code, language = "javascript", framework = "jest", filePath = "unknown" } = payload;
    
    logger.info({ language, framework, filePath }, `[${this.id}] Generating tests`);
    
    try {
      const functions = this.extractFunctions(code, language);
      
      const prompt = `Generate comprehensive unit tests for the following code using ${framework}.
      
Code to test:
\`\`\`${language}
${code}
\`\`\`

Functions found: ${functions.map(f => f.name).join(", ")}

Generate tests that cover:
1. Happy path scenarios
2. Edge cases
3. Error handling
4. Mock external dependencies

Return ONLY the test code, no explanations.`;

      const result = await modelRouter.execute(
        {
          system: "You are an expert software engineer specializing in unit testing and test-driven development.",
          user: prompt
        },
        {
          task: "test_generation",
          complexity: functions.length > 5 ? "high" : "medium",
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        filePath,
        language,
        framework,
        functionsCount: functions.length,
        testCode: result.output,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] Test generation failed`);
      throw error;
    }
  }

  /**
   * Generate JSDoc/Docstrings documentation
   */
  async generateDocumentation(payload = {}) {
    const { code, language = "javascript", style = "jsdoc", filePath = "unknown" } = payload;
    
    logger.info({ language, style, filePath }, `[${this.id}] Generating documentation`);
    
    try {
      const functions = this.extractFunctions(code, language);
      
      const docStyle = language === "python" ? "docstring (Google style)" : "JSDoc";
      
      const prompt = `Add comprehensive ${docStyle} documentation to this code.

Code:
\`\`\`${language}
${code}
\`\`\`

For each function, include:
1. Description of what it does
2. @param tags for parameters with types
3. @returns tag for return value
4. @throws for exceptions
5. @example if applicable

Return the COMPLETE code with documentation added, no explanations.`;

      const result = await modelRouter.execute(
        {
          system: "You are an expert technical writer specializing in code documentation.",
          user: prompt
        },
        {
          task: "documentation_generation",
          complexity: "medium",
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        filePath,
        language,
        style: docStyle,
        functionsCount: functions.length,
        documentedCode: result.output,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] Documentation generation failed`);
      throw error;
    }
  }

  /**
   * Refactor legacy code to modern standards
   */
  async refactorCode(payload = {}) {
    const { code, language = "javascript", target = "modern", filePath = "unknown" } = payload;
    
    logger.info({ language, target, filePath }, `[${this.id}] Refactoring code`);
    
    try {
      const smells = this.detectCodeSmells(code, language);
      
      const prompt = `Refactor this ${language} code to modern ${target} standards.

Current code:
\`\`\`${language}
${code}
\`\`\`

Detected issues: ${smells.map(s => s.type).join(", ")}

Apply these transformations:
- Convert callbacks to Promises/async-await
- Use arrow functions where appropriate
- Apply ES6+ features (const/let, destructuring, spread operator)
- Remove var declarations
- Improve variable naming
- Extract magic numbers to constants
- Simplify complex conditionals
- Remove code duplication

Return ONLY the refactored code, no explanations.`;

      const result = await modelRouter.execute(
        {
          system: "You are an expert software architect specializing in code modernization and refactoring.",
          user: prompt
        },
        {
          task: "code_refactoring",
          complexity: smells.length > 5 ? "high" : "medium",
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        filePath,
        language,
        target,
        smellsDetected: smells.length,
        refactoredCode: result.output,
        improvements: smells.map(s => s.type),
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] Refactoring failed`);
      throw error;
    }
  }

  /**
   * Generate API documentation from Express routes
   */
  async generateApiDocs(payload = {}) {
    const { code, format = "openapi", filePath = "unknown" } = payload;
    
    logger.info({ format, filePath }, `[${this.id}] Generating API docs`);
    
    try {
      const routes = this.extractExpressRoutes(code);
      
      const prompt = `Generate ${format} documentation for these Express.js API routes.

Routes code:
\`\`\`javascript
${code}
\`\`\`

Detected routes: ${routes.map(r => `${r.method} ${r.path}`).join(", ")}

Generate complete ${format} specification with:
1. Endpoint paths and methods
2. Request parameters and body schema
3. Response schema
4. Status codes
5. Authentication requirements
6. Examples

Return in ${format === "openapi" ? "OpenAPI 3.0 YAML" : "Markdown"} format.`;

      const result = await modelRouter.execute(
        {
          system: "You are an expert API documentation specialist.",
          user: prompt
        },
        {
          task: "api_documentation",
          complexity: routes.length > 10 ? "high" : "medium",
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        filePath,
        format,
        routesCount: routes.length,
        documentation: result.output,
        routes: routes,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] API docs generation failed`);
      throw error;
    }
  }

  /**
   * Extract Express routes from code
   */
  extractExpressRoutes(code) {
    const routes = [];
    
    try {
      const ast = this.parseJavaScript(code);
      
      traverse.default(ast, {
        CallExpression(path) {
          const callee = path.node.callee;
          
          // Detect app.get(), router.post(), etc.
          if (callee.type === "MemberExpression") {
            const method = callee.property.name;
            const httpMethods = ["get", "post", "put", "patch", "delete", "all"];
            
            if (httpMethods.includes(method)) {
              const pathArg = path.node.arguments[0];
              if (pathArg && pathArg.type === "StringLiteral") {
                routes.push({
                  method: method.toUpperCase(),
                  path: pathArg.value
                });
              }
            }
          }
        }
      });
    } catch (error) {
      logger.warn({ error: error.message }, "Failed to extract routes");
    }
    
    return routes;
  }

  /**
   * Convert code between languages
   */
  async convertLanguage(payload = {}) {
    const { code, fromLang, toLang, filePath = "unknown" } = payload;
    
    logger.info({ fromLang, toLang, filePath }, `[${this.id}] Converting code`);
    
    try {
      const prompt = `Convert this ${fromLang} code to ${toLang}.

Source code (${fromLang}):
\`\`\`${fromLang}
${code}
\`\`\`

Requirements:
1. Maintain the same functionality
2. Use idiomatic ${toLang} patterns
3. Follow ${toLang} naming conventions
4. Add appropriate type hints/annotations
5. Handle language-specific differences (async, error handling, etc.)

Return ONLY the converted ${toLang} code, no explanations.`;

      const result = await modelRouter.execute(
        {
          system: `You are an expert polyglot programmer specializing in ${fromLang} and ${toLang}.`,
          user: prompt
        },
        {
          task: "code_conversion",
          complexity: "high",
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        filePath,
        fromLang,
        toLang,
        convertedCode: result.output,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] Code conversion failed`);
      throw error;
    }
  }

  /**
   * Detect code smells and suggest refactoring
   */
  detectCodeSmells(code, language = "javascript") {
    const smells = [];
    
    try {
      if (language === "javascript" || language === "typescript") {
        const ast = this.parseJavaScript(code);
        
        // Detect var usage
        traverse.default(ast, {
          VariableDeclaration(path) {
            if (path.node.kind === "var") {
              smells.push({
                type: "var_usage",
                severity: "medium",
                message: "Use const or let instead of var",
                loc: path.node.loc
              });
            }
          },
          
          // Detect long functions
          FunctionDeclaration(path) {
            const lineCount = path.node.loc ? 
              path.node.loc.end.line - path.node.loc.start.line : 0;
            
            if (lineCount > 50) {
              smells.push({
                type: "long_function",
                severity: "high",
                message: `Function ${path.node.id?.name} is ${lineCount} lines long`,
                loc: path.node.loc
              });
            }
          },
          
          // Detect nested callbacks
          CallExpression(path) {
            let depth = 0;
            let current = path;
            
            while (current) {
              if (current.node.type === "FunctionExpression" || 
                  current.node.type === "ArrowFunctionExpression") {
                depth++;
              }
              current = current.parentPath;
            }
            
            if (depth > 3) {
              smells.push({
                type: "callback_hell",
                severity: "high",
                message: "Deep callback nesting detected, consider using async/await",
                loc: path.node.loc
              });
            }
          },
          
          // Detect magic numbers
          NumericLiteral(path) {
            const parent = path.parent;
            if (parent.type !== "VariableDeclarator" && 
                path.node.value !== 0 && 
                path.node.value !== 1) {
              smells.push({
                type: "magic_number",
                severity: "low",
                message: `Magic number ${path.node.value} should be a named constant`,
                loc: path.node.loc
              });
            }
          }
        });
      }
    } catch (error) {
      logger.warn({ error: error.message }, "Code smell detection incomplete");
    }
    
    return smells;
  }

  /**
   * Comprehensive code analysis
   */
  async analyzeCode(payload = {}) {
    const { code, language = "javascript", filePath = "unknown" } = payload;
    
    logger.info({ language, filePath }, `[${this.id}] Analyzing code`);
    
    try {
      const smells = this.detectCodeSmells(code, language);
      const functions = this.extractFunctions(code, language);
      
      const prompt = `Perform comprehensive code analysis on this ${language} code.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide analysis including:
1. Code quality score (0-10)
2. Complexity assessment
3. Security concerns
4. Performance issues
5. Maintainability issues
6. Best practice violations
7. Specific refactoring suggestions

Format as JSON.`;

      const result = await modelRouter.execute(
        {
          system: "You are a senior code reviewer and software architect.",
          user: prompt
        },
        {
          task: "code_analysis",
          complexity: smells.length > 5 ? "high" : "medium",
          requiresSearch: false
        }
      );

      return {
        agentId: this.id,
        filePath,
        language,
        functionsCount: functions.length,
        smellsCount: smells.length,
        smells: smells,
        analysis: result.output,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error: error.message }, `[${this.id}] Code analysis failed`);
      throw error;
    }
  }
}

export const devAssistantAgent = new DevAssistantAgent();
export default devAssistantAgent;
