import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
    ],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': ['warn', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      }],
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
      }],
      'comma-dangle': ['warn', 'always-multiline'],
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'quotes': ['warn', 'single'],
      'semi': ['warn', 'always'],
    },
  },
];
