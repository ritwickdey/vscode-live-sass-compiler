module.exports = {
    env: {
        es6: true,
        node: true,
    },
    parser: "@typescript-eslint/parser", // Specifies the ESLint parser
    parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: "module", // Allows for the use of imports
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    ],
    rules: {
        // enable additional rules
        semi: ["error", "always"],

        // override default options for rules from base configurations
        "no-cond-assign": ["error", "always"],

        // disable rules from base configurations
        "no-console": "off",

        // ts rules
        "@typescript-eslint/ban-ts-comment": "off",
    },
};
