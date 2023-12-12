module.exports = {
    root: true,
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
    },
    env: { browser: true, es2020: true },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
    rules: {
        // override/add rules settings here, such as:
        // 'vue/no-unused-vars': 'error'
    },
};
