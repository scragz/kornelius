module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true, // Add browser environment
    es2020: true   // Specify ES version
  },
  globals: {
    acquireVsCodeApi: 'readonly' // Define the VS Code webview API function
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase']
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE']
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow'
      },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require'
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      }
    ],
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'quotes': ['error', 'single', { 'avoidEscape': true }]
  },
  ignorePatterns: ['out', '**/*.d.ts'],
  overrides: [ // Add overrides for specific files
    {
      files: ['.eslintrc.js'], // Target the ESLint config file
      env: {
        node: true // Specify Node.js environment for this file
      }
    }
  ]
};
