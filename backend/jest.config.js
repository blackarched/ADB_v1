/** @type {import('jest').Config} */
const config = {
  verbose: true,
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  modulePaths: ['<rootDir>/node_modules'], // Explicitly add backend's node_modules to search paths
  // Jest's default resolver doesn't handle ES module exports maps well sometimes.
  // Explicitly setting moduleFileExtensions and transform might be needed for complex setups,
  // but for now, Node's experimental ESM support in Jest should work with basic ESM.
  // If running into issues with ES Modules, you might need babel-jest or ts-jest for transpilation.
  // For pure ESM projects, ensure your Node version is >=14 and Jest is >=27.

  // If you use import assertions or top-level await, ensure your Node version supports them.
  // Jest uses Node's capabilities for these.

  // For this project, since we set "type": "module" in package.json,
  // Jest should attempt to load .js files as ES modules.
  // We might need to adjust if there are CommonJS dependencies causing issues.

  // Collect coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8", // or "babel" if using babel-jest
  coverageReporters: ["json", "text", "lcov", "clover"],
  // coverageThreshold: { // Example, will be enforced in CI later
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10,
  //   },
  // },

  // Module name mapper for aliased paths if you add them (e.g., @/...)
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>/src/$1', // Example
  // },

  // setupFilesAfterEnv: [], // No setup files for now that try to import dotenv
};

export default config;
