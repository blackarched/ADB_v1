import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


// Note: We will import adb functions *after* mocking child_process
// import { getDevices, getDeviceProperties, executeShellCommand } from '../adb.js';

// Mock the child_process module using jest.unstable_mockModule for ESM
const mockSpawnFn = jest.fn();
jest.unstable_mockModule('child_process', () => ({
  // Default export if child_process is imported like `import cp from 'child_process'`
  // default: {
  //   spawn: mockSpawnFn,
  // },
  // Named export
  spawn: mockSpawnFn,
}));

// Now dynamically import the module that uses the mocked dependency
const { getDevices, getDeviceProperties, executeShellCommand } = await import('../adb.js');
const { spawn } = await import('child_process'); // Get the mocked spawn


describe('adb.js', () => {
  let mockSpawnInstance;

  beforeEach(() => {
    // Reset mocks before each test
    mockSpawnFn.mockReset(); // Use the original jest.fn() reference for reset

    // Setup a default mock spawn instance for most tests
    mockSpawnInstance = {
      stdout: { on: jest.fn((event, cb) => { if(event === 'data') { /* cb(''); */ } }) },
      stderr: { on: jest.fn((event, cb) => { if(event === 'data') { /* cb(''); */ } }) },
      on: jest.fn((event, cb) => {
        if (event === 'close') {
          cb(0);
        }
      }),
      kill: jest.fn(),
    };
    mockSpawnFn.mockReturnValue(mockSpawnInstance); // mockSpawnFn is the one from jest.fn()
  });

  describe('getDevices', () => {
    it('should call spawn with "devices -l" and parse output correctly', async () => {
      const mockOutput = `List of devices attached
emulator-5554          device product:sdk_gphone_x86 model:sdk_gphone_x86 device:generic_x86 transport_id:1
192.168.1.100:5555     device product:other_product model:other_model device:other_device transport_id:2
`;
      mockSpawnInstance.stdout.on = jest.fn((event, cb) => {
        if (event === 'data') {
          cb(mockOutput);
        }
      });

      const devices = await getDevices();

      expect(mockSpawnFn).toHaveBeenCalledWith(process.env.ADB_COMMAND_PATH || 'adb', ['devices', '-l'], expect.any(Object));
      expect(devices).toEqual([
        { serial: 'emulator-5554', state: 'device', model: 'sdk_gphone_x86', product: 'sdk_gphone_x86', device: 'generic_x86', transport_id: '1' },
        { serial: '192.168.1.100:5555', state: 'device', model: 'other_model', product: 'other_product', device: 'other_device', transport_id: '2' },
      ]);
    });

    it('should return an empty array if adb command fails', async () => {
      // Simulate an error exit
      mockSpawnInstance.on = jest.fn((event, cb) => {
        if (event === 'close') {
          cb(1); // Non-zero exit code
        }
      });
      mockSpawnInstance.stderr.on = jest.fn((event, cb) => {
        if (event === 'data') {
          cb('daemon not running');
        }
      });

      const devices = await getDevices();
      expect(devices).toEqual([]);
    });

     it('should handle empty or malformed output from adb devices', async () => {
      mockSpawnInstance.stdout.on = jest.fn((event, cb) => {
        if (event === 'data') {
          cb('List of devices attached\n'); // Only header
        }
      });
      let devices = await getDevices();
      expect(devices).toEqual([]);

      mockSpawnInstance.stdout.on = jest.fn((event, cb) => {
        if (event === 'data') {
          cb('malformed output line');
        }
      });
      devices = await getDevices();
      expect(devices).toEqual([]); // Should not parse malformed lines
    });
  });

  describe('getDeviceProperties', () => {
    it('should call spawn with "shell getprop" and parse properties', async () => {
      const mockPropOutput = `[ro.product.model]: [Pixel 5]
[ro.build.version.release]: [12]
[persist.sys.timezone]: [America/Los_Angeles]`;

      mockSpawnInstance.stdout.on = jest.fn((event, cb) => {
        if (event === 'data') cb(mockPropOutput);
      });

      const deviceId = 'emulator-5554';
      const props = await getDeviceProperties(deviceId);

      expect(spawn).toHaveBeenCalledWith(process.env.ADB_COMMAND_PATH || 'adb', ['-s', deviceId, 'shell', 'getprop'], expect.any(Object));
      expect(props).toEqual({
        'ro.product.model': 'Pixel 5',
        'ro.build.version.release': '12',
        'persist.sys.timezone': 'America/Los_Angeles',
      });
    });

    it('should throw an error if getprop fails', async () => {
      mockSpawnInstance.on = jest.fn((event, cb) => {
        if (event === 'close') cb(1); // Error code
      });
      mockSpawnInstance.stderr.on = jest.fn((event, cb) => {
        if (event === 'data') cb('device not found');
      });

      const deviceId = 'emulator-5554';
      await expect(getDeviceProperties(deviceId)).rejects.toMatchObject({
        message: expect.stringContaining('device not found'),
      });
    });
  });

  describe('executeShellCommand', () => {
    it('should execute a shell command and return stdout', async () => {
      const deviceId = 'test-device';
      const command = 'ls /data/local/tmp';
      const expectedOutput = 'file1.txt\nfile2.txt';

      mockSpawnInstance.stdout.on = jest.fn((event, cb) => {
        if (event === 'data') cb(expectedOutput);
      });

      const output = await executeShellCommand(deviceId, command);

      expect(spawn).toHaveBeenCalledWith(process.env.ADB_COMMAND_PATH || 'adb', ['-s', deviceId, 'shell', command], expect.any(Object));
      expect(output).toBe(expectedOutput);
    });

    it('should throw if shell command execution fails', async () => {
      const deviceId = 'test-device';
      const command = 'ls /nonexistent';
      const errorOutput = 'ls: /nonexistent: No such file or directory';

      mockSpawnInstance.on = jest.fn((event, cb) => {
        if (event === 'close') cb(1); // Error code
      });
      mockSpawnInstance.stderr.on = jest.fn((event, cb) => {
        if (event === 'data') cb(errorOutput);
      });

      await expect(executeShellCommand(deviceId, command)).rejects.toThrow(errorOutput);
    });

    it('should throw if deviceId or command is missing', async () => {
      await expect(executeShellCommand(null, 'command')).rejects.toThrow('Device ID is required');
      await expect(executeShellCommand('device', null)).rejects.toThrow('Command is required');
    });
  });

  // TODO: Add tests for getDeviceLogcat (mocking its stream events), rebootDevice, installApk, takeScreenshot
  // For getDeviceLogcat, you'd need to simulate process.stdout.emit('data', ...), process.stderr.emit('data', ...), process.emit('close'), process.emit('error')
});
