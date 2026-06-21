const eslint = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    { ignores: ['dist/', 'node_modules/'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
);
