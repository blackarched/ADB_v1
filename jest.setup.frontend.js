// jest.setup.frontend.js (in the project root)
import '@testing-library/jest-dom';

// You can add other global setup for your frontend tests here, for example:
// - Mocking global objects like 'fetch' or 'localStorage' if needed universally
// - Setting up a mock server (e.g., MSW) for API calls

// Example global mock for fetch (if you don't use a more sophisticated solution like MSW)
/*
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ mockData: true }),
    ok: true,
    status: 200,
  })
);
*/

// Mock for Socket.IO client if needed globally, or mock it per test/module
/*
jest.mock('socket.io-client', () => {
  const mocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    connected: true, // Initial state
  };
  return jest.fn(() => mocket);
});
*/

// Clean up after each test if needed (e.g., clear mocks)
// afterEach(() => {
//   jest.clearAllMocks();
// });
