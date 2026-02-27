/** @type {import("jest").Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
  moduleFileExtensions: ["ts", "js"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  // Source files use .js extensions (TS ESM convention); strip them so Jest resolves .ts
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  clearMocks: true,
};

module.exports = config;
