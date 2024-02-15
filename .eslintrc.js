/* eslint-disable */
module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/triple-slash-reference": 0,
        "@typescript-eslint/no-non-null-asserted-optional-chain": 0,
        semi: [
			'warn',
			'always'
		],
        quotes: [
			'warn',
			'double',
			{ allowTemplateLiterals: true, avoidEscape: true  },
		],
        '@typescript-eslint/no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_' }
		],
    }
}
