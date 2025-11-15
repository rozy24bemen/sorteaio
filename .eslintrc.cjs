module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  parserOptions: { project: ["./tsconfig.json"] },
  ignorePatterns: [
    // Exclude tests from lint errors for MVP; keep type-safety focus on production code
    "tests/**"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": ["error"],
  },
  overrides: [
    {
      files: ["tests/**/*.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
      }
    }
  ]
};
