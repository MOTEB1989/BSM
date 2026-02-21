import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    // Node.js files (server-side)
    files: ['src/**/*.js', 'scripts/**/*.js', 'mcp-servers/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in Node.js
      'no-undef': 'error',
      'no-duplicate-imports': 'error',

      // Best practices
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'no-throw-literal': 'error',

      // ES6+
      'arrow-spacing': 'error',
      'template-curly-spacing': 'error',
      'object-shorthand': 'warn',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // Browser files (client-side)
    files: [
      'docs/**/*.js',
      'src/chat/**/*.js',
      'src/admin/**/*.js',
      'frontend/**/*.js',
      'examples/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        // Third-party libraries (common)
        Vue: 'readonly',
        marked: 'readonly',
        Prism: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
  {
    // MJS files with special handling
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'reports/**',
      'report/**',
      '.git/**',
      'lexprim-chat/node_modules/**',
      'mcp-servers/node_modules/**',
    ],
  },
];
