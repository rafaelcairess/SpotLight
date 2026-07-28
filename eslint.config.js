import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The project still uses React 18 patterns that intentionally initialize
      // local UI state from effects. These React Compiler rules are aimed at
      // compiler-enabled React 19 applications and currently report false
      // positives here (including every prop after a forwarded input ref).
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      // ESLint 10 added this rule to the recommended preset. Existing retry
      // flows intentionally retain the latest response for later inspection.
      "no-useless-assignment": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Providers and their hooks intentionally share a module so consumers use
    // one public entry point. This is safe; only these two files are exempt.
    files: ["src/contexts/*Context.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
