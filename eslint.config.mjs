import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";

const structuralRules = {
	complexity: ["error", 12],
	"max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
	"max-lines-per-function": [
		"error",
		{ max: 140, skipBlankLines: true, skipComments: true, IIFEs: true },
	],
	"max-statements": ["error", 50],
	"sonarjs/cognitive-complexity": ["error", 12],
};

export default [
	{
		ignores: [
			"node_modules/**",
			"coverage/**",
			"dist/**",
			".artifacts/**",
			"_site/**",
			"__pycache__/**",
		],
	},
	js.configs.recommended,
	{
		files: ["**/*.mjs"],
		plugins: { sonarjs },
		languageOptions: {
			sourceType: "module",
			globals: {
				console: "readonly",
				process: "readonly",
			},
		},
		rules: {
			"no-console": "off",
			"no-undef": "off",
			...structuralRules,
		},
	},
	{
		files: ["**/*.test.mjs"],
		rules: {
			complexity: "off",
			"max-lines": "off",
			"max-lines-per-function": "off",
			"max-statements": "off",
			"sonarjs/cognitive-complexity": "off",
		},
	},
];
