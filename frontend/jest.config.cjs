/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
  testPathIgnorePatterns: ["/node_modules/", "/__mocks__/"],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Replace Vite-only client.ts with a plain axios instance (import.meta.env is Vite-specific)
    "^\\.{0,2}/client$": "<rootDir>/src/__tests__/__mocks__/apiClient.ts",
  },
  clearMocks: true,
};
