module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ],
    plugins: [
        '@typescript-eslint',
        'prettier',
        'unused-imports'
    ],
    rules: {
        // 优先使用 const
        'prefer-const': 'warn',

        // 禁止多余的变量声明
        'no-unused-vars': ['warn', { 'vars': 'all', 'args': 'after-used', 'ignoreRestSiblings': false }],

        // 禁止引入未使用的模块
        'unused-imports/no-unused-imports': 'warn',

        // 其他常见代码规范
        'no-var': 'error',              // 禁止使用 var
        'eqeqeq': 'warn',               // 强制使用 === 和 !==
        'no-console': 'warn',           // 禁止使用 console
        'curly': 'error',               // 强制所有控制语句使用大括号
        'no-duplicate-imports': 'error' // 禁止重复导入
    }
};
