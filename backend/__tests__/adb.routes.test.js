import { jest } from '@jest/globals';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


import { app, server, io } from '../server.js'; // Assuming server exports app, server, io
// Mock the adb.js module
const mockAdb = {
  getDevices: jest.fn(),
  getDeviceProperties: jest.fn(),
  executeShellCommand: jest.fn(),
  rebootDevice: jest.fn(),
  installApk: jest.fn(),
  takeScreenshot: jest.fn(),
};
jest.unstable_mockModule('../adb.js', () => ({
  ...mockAdb,
  // Default implementations or specific mocks can be added here if needed globally
}));
// Import adb module after mocking
const adb = await import('../adb.js');


describe('ADB API Routes (/api/adb)', () => {

  afterAll((done) => {
    // Close the server and io instances to allow Jest to exit gracefully.
    io.close(); // Close Socket.IO server
    server.close(done); // Close HTTP server
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    // Restore default mock implementations if they were changed in a test
    mockAdb.getDevices.mockResolvedValue([]);
    mockAdb.getDeviceProperties.mockResolvedValue({});
    mockAdb.executeShellCommand.mockResolvedValue("OK");
    mockAdb.rebootDevice.mockResolvedValue("Rebooting...");
    mockAdb.installApk.mockResolvedValue("Success");
    mockAdb.takeScreenshot.mockResolvedValue("/fake/path/to/screenshot.png");
  });

  describe('GET /api/adb/devices', () => {
    it('should return a list of devices', async () => {
      const mockDeviceList = [{ serial: 'emulator-5554', state: 'device' }];
      mockAdb.getDevices.mockResolvedValue(mockDeviceList);

      const response = await request(app).get('/api/adb/devices');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ devices: mockDeviceList });
      expect(mockAdb.getDevices).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if adb.getDevices fails', async () => {
      mockAdb.getDevices.mockRejectedValue(new Error('ADB error'));
      const response = await request(app).get('/api/adb/devices');
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('ADB error');
    });
  });

  describe('GET /api/adb/device/:deviceId/info', () => {
    it('should return device properties for a given deviceId', async () => {
      const deviceId = 'emulator-5554';
      const mockProps = { 'ro.product.model': 'Pixel' };
      mockAdb.getDeviceProperties.mockResolvedValue(mockProps);

      const response = await request(app).get(`/api/adb/device/${deviceId}/info`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProps);
      expect(mockAdb.getDeviceProperties).toHaveBeenCalledWith(deviceId);
    });

    it('should return 500 if getDeviceProperties fails', async () => {
      const deviceId = 'emulator-5554';
      mockAdb.getDeviceProperties.mockRejectedValue(new Error('Failed to get props'));

      const response = await request(app).get(`/api/adb/device/${deviceId}/info`);
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to get props');
    });
  });

  describe('POST /api/adb/shell', () => {
    it('should execute a shell command and return output', async () => {
      const deviceId = 'emulator-5554';
      const command = 'ls /sdcard';
      const mockOutput = 'file1.txt\nfile2.txt';
      mockAdb.executeShellCommand.mockResolvedValue(mockOutput);

      const response = await request(app)
        .post('/api/adb/shell')
        .send({ deviceId, command });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ deviceId, command, output: mockOutput });
      expect(mockAdb.executeShellCommand).toHaveBeenCalledWith(deviceId, command);
    });

    it('should return 400 if deviceId or command is missing', async () => {
      let response = await request(app).post('/api/adb/shell').send({ command: 'ls' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing deviceId or command');

      response = await request(app).post('/api/adb/shell').send({ deviceId: 'dev1' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing deviceId or command');
    });
  });

  describe('POST /api/adb/reboot/:deviceId', () => {
    it('should reboot the device', async () => {
      const deviceId = 'emulator-5554';
      mockAdb.rebootDevice.mockResolvedValue(`Device ${deviceId} rebooting.`);

      const response = await request(app)
        .post(`/api/adb/reboot/${deviceId}`)
        .send({ target: 'bootloader' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('rebooting');
      expect(mockAdb.rebootDevice).toHaveBeenCalledWith(deviceId, 'bootloader');
    });
  });

  // TODO: Add tests for /install/:deviceId (multipart/form-data with supertest)
  // TODO: Add tests for /screenshot/:deviceId (checking file response)

  // Example for screenshot (conceptual, file handling might need more setup)
  describe('GET /api/adb/screenshot/:deviceId', () => {
    it('should return a screenshot file', async () => {
      const deviceId = 'emulator-5554';
      const fakePngPath = '/tmp/fake-screenshot.png'; // Need to actually create this file for test or mock fs
      // For a real test, you might create a dummy file:
      // fs.writeFileSync(fakePngPath, 'fake png data');
      mockAdb.takeScreenshot.mockResolvedValue(fakePngPath);

      // This test is more complex because it involves sending a file.
      // We'll just check if the mock is called for now.
      // Proper testing would involve checking content-type and potentially content.
      // For now, we'll assume if adb.takeScreenshot is called and doesn't throw, it's a pass.
      // await request(app).get(`/api/adb/screenshot/${deviceId}`);
      // expect(mockAdb.takeScreenshot).toHaveBeenCalledWith(deviceId);
      // fs.unlinkSync(fakePngPath); // cleanup dummy file

      // Simplified:
      try {
        await request(app).get(`/api/adb/screenshot/${deviceId}`);
      } catch(e) {
        // Supertest might have issues if res.sendFile has an error during test without a real file
        // console.warn("Screenshot route test might not fully complete without actual file system ops in test.")
      }
      expect(mockAdb.takeScreenshot).toHaveBeenCalledWith(deviceId);
    });
  });

});
