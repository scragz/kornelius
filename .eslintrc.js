module.exports = {
  env: {
    node: true, // Primarily a Node.js project (extension backend)
    es2020: true,
  },
  extends: [
    'eslint:recommended', // Basic ESLint recommendations
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  ignorePatterns: ['out/', 'node_modules/', '.vscode-test/'], // Ignore build output, deps, tests
  overrides: [
    {
      // TypeScript specific configuration for src directory
      files: ['src/**/*.ts'],
      parser: '@typescript-eslint/parser', // Use TypeScript parser
      plugins: [
        '@typescript-eslint', // Enable TypeScript plugin
      ],
      extends: [
        'plugin:@typescript-eslint/recommended', // Recommended TS rules
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module', // TS files use ES modules
        project: './tsconfig.json', // Point to tsconfig for type-aware rules (optional but good)
      },
      rules: {
        // Add any specific TS rule overrides here if needed
        // e.g., '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      },
    },
    {
      // JavaScript specific configuration for media/js directory
      files: ['media/js/**/*.js'],
      env: {
        browser: true, // Webview environment
        node: false, // Not Node.js
        es2020: true,
      },
      parserOptions: {
        sourceType: 'module', // These are ES modules
      },
      rules: {
        // Disable TS-specific rules that might leak in or cause issues
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in JS if needed
        // Add any specific JS rules here if needed
        'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Standard JS unused vars warning
      },
    },
  ],
  rules: {
    // Add any global rule overrides here
  },
};
