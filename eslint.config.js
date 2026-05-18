const jestPlugin = require('eslint-plugin-jest');

module.exports = [
  // ===== ГЛОБАЛЬНІ НАЛАШТУВАННЯ (ІГНОРИ) =====
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      '*.log',
      '.env*',
      'public/js/**',
      'public/css/**'
    ]
  },

  // ===== БАЗОВІ ПРАВИЛА ДЛЯ ВСІХ JS ФАЙЛІВ =====
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Browser globals (for frontend)
        window: 'readonly',
        document: 'readonly',
        alert: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly'
      }
    },
    plugins: {
      jest: jestPlugin
    },
    rules: {
      // ===== БАЗОВІ =====
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-debugger': 'warn',

      // ===== ФОРМАТУВАННЯ =====
      'indent': ['warn', 2],
      'quotes': ['warn', 'single'],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'never'],
      'arrow-spacing': 'warn',

      // ===== ЛОГІКА =====
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-implicit-coercion': 'warn',
      'eqeqeq': ['warn', 'always'],

      // ===== EXPRESS/ASYNC =====
      'no-async-promise-executor': 'warn',

      // ===== JEST TESTS =====
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error'
    }
  },

  // ===== СПЕЦИФІЧНІ НАЛАШТУВАННЯ ДЛЯ SRC =====
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        require: 'readonly',
        module: 'readonly'
      }
    }
  },

  // ===== СПЕЦИФІЧНІ НАЛАШТУВАННЯ ДЛЯ ТЕСТІВ =====
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },

  // ===== СПЕЦИФІЧНІ НАЛАШТУВАННЯ ДЛЯ PUBLIC (FRONTEND) =====
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        alert: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];