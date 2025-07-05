import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as adb from '../adb.js'; // Assuming adb.js is in the parent directory

const router = express.Router();

// ESM equivalent of __dirname for this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup multer for APK uploads
// Ensure 'temp_files/uploads/' directory exists
const uploadDir = path.join(__dirname, '../../temp_files/uploads'); // Relative to backend/routes, so ../../temp_files
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });


// GET /api/adb/devices - List all connected devices
router.get('/devices', async (req, res) => {
  try {
    const devices = await adb.getDevices();
    res.json({ devices });
  } catch (error) {
    console.error('Route error /api/adb/devices:', error);
    res.status(500).json({ error: error.message || 'Failed to get ADB devices' });
  }
});

// GET /api/adb/device/:deviceId/info - Get detailed info for a specific device
router.get('/device/:deviceId/info', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const properties = await adb.getDeviceProperties(deviceId);
    // You might want to select/filter specific properties or enrich them here
    // For example, to get battery:
    // const batteryInfo = await adb.executeShellCommand(deviceId, 'dumpsys battery');
    // Parse batteryInfo and add to properties object
    res.json(properties);
  } catch (error) {
    console.error(`Route error /api/adb/device/${deviceId}/info:`, error);
    res.status(500).json({ error: error.message || `Failed to get device info for ${deviceId}` });
  }
});

// POST /api/adb/shell - Execute a shell command on a device
router.post('/shell', async (req, res) => {
  const { deviceId, command } = req.body;
  if (!deviceId || !command) {
    return res.status(400).json({ error: 'Missing deviceId or command in request body' });
  }
  try {
    const output = await adb.executeShellCommand(deviceId, command);
    res.json({ deviceId, command, output });
  } catch (error) {
    console.error('Route error /api/adb/shell:', error);
    res.status(500).json({ error: error.message || 'Failed to execute shell command' });
  }
});

// POST /api/adb/reboot/:deviceId - Reboot a device
router.post('/reboot/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { target } = req.body; // Optional target (e.g., 'recovery', 'bootloader')
  try {
    const message = await adb.rebootDevice(deviceId, target);
    res.json({ message });
  } catch (error) {
    console.error(`Route error /api/adb/reboot/${deviceId}:`, error);
    res.status(500).json({ error: error.message || `Failed to reboot device ${deviceId}` });
  }
});

// POST /api/adb/install/:deviceId - Install an APK on a device
router.post('/install/:deviceId', upload.single('apk'), async (req, res) => {
  const { deviceId } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No APK file uploaded.' });
  }

  const apkPath = req.file.path;
  console.log(`Received APK for install on ${deviceId}: ${apkPath}`);

  try {
    // Progress for APK install via HTTP is tricky.
    // The adb.installApk function itself doesn't provide live progress for CLI.
    // For true live progress, a WebSocket based approach would be better where backend
    // chunks the file, pushes to device, and sends progress messages.
    // For now, we just call it and wait for completion.
    const message = await adb.installApk(deviceId, apkPath);
    res.json({ message: message || `APK ${req.file.originalname} installation initiated on ${deviceId}.` });
  } catch (error) {
    console.error(`Route error /api/adb/install/${deviceId}:`, error);
    res.status(500).json({ error: error.message || `Failed to install APK on ${deviceId}` });
  } finally {
    // Clean up the uploaded APK file after attempting installation
    fs.unlink(apkPath, (err) => {
      if (err) console.error(`Failed to delete temporary APK file ${apkPath}:`, err);
      else console.log(`Deleted temporary APK file: ${apkPath}`);
    });
  }
});

// GET /api/adb/screenshot/:deviceId - Take a screenshot and return it
router.get('/screenshot/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const serverPathToScreenshot = await adb.takeScreenshot(deviceId);
    res.sendFile(serverPathToScreenshot, (err) => {
      if (err) {
        console.error(`Error sending screenshot file ${serverPathToScreenshot}:`, err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to send screenshot file.' });
        }
      }
      // Clean up the screenshot from the server after sending
      fs.unlink(serverPathToScreenshot, (unlinkErr) => {
        if (unlinkErr) console.error(`Failed to delete server screenshot ${serverPathToScreenshot}:`, unlinkErr);
        else console.log(`Deleted server screenshot: ${serverPathToScreenshot}`);
      });
    });
  } catch (error) {
    console.error(`Route error /api/adb/screenshot/${deviceId}:`, error);
    if (!res.headersSent) {
        res.status(500).json({ error: error.message || `Failed to take screenshot on ${deviceId}` });
    }
  }
});


// Note: Logcat streaming will be handled via WebSockets directly in server.js, not as a REST endpoint.

export default router;
