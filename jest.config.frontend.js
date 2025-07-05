// jest.config.frontend.js
export default {
  verbose: true,
  testEnvironment: 'jest-environment-jsdom', // Key part
  rootDir: './src', // Process files inside src
  moduleDirectories: ['node_modules', '../node_modules'], // Look in src/node_modules and root node_modules

  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest', // Using babel-jest for JS/JSX
  },

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/../jest.setup.frontend.js'],

  // Simplification: remove coverage for now to isolate the environment issue
  // collectCoverage: true,
  // coverageDirectory: "<rootDir>/../coverage/frontend",
  // coverageProvider: "babel",
};
