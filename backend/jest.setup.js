import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file BEFORE any tests run
// This ensures process.env is populated when modules like adb.js are imported.
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Path relative to backend/jest.setup.js

// You can add other global test setup here if needed
// For example, setting up a mock database, or global mocks.

// console.log('Jest setup: .env loaded. ADB_HOST:', process.env.ADB_HOST); // For debugging
