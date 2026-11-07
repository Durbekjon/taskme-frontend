import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler's `set-state-in-effect` flags any effect that
      // transitively calls setState, including "load data on mount, store the
      // result" - it cannot see that the update happens after an await. That
      // pattern is used deliberately throughout the app's pages, so the rule
      // is kept as a warning rather than being disabled outright or worked
      // around with per-call-site suppressions.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
