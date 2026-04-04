import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        ignores: ['.dev-server/**'],
    },
    {
        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            'prettier/prettier': ['off', { endOfLine: 'auto' }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-useless-escape': 'off',
            'no-console': 'off',
            'no-var': 'error',
            'no-trailing-spaces': 'error',
            'prefer-const': 'warn',
            'prefer-template': 'off',
            'no-case-declarations': 'warn',
            'no-prototype-builtins': 'warn',
            'no-global-assign': 'warn',
            curly: 'off',
            'quote-props': 'off',
            'no-else-return': 'off',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/check-tag-names': 'off',
            'jsdoc/tag-lines': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/no-defaults': 'off',
            'no-undef': 'off',
            'brace-style': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            quotes: [
                'error',
                'single',
                {
                    avoidEscape: true,
                    allowTemplateLiterals: true,
                },
            ],
        },
    },
    {
        files: ['**/*.d.ts'],
        rules: {
            quotes: 'off',
        },
    },
];
