import { spawn } from 'child_process';
import path from 'path';

const ADB_COMMAND = process.env.ADB_COMMAND_PATH || 'adb'; // Allow overriding ADB path

/**
 * Executes an ADB command.
 * @param {string[]} args - Array of arguments for the ADB command.
 * @param {string} [deviceId] - Optional device serial to target with -s.
 * @returns {Promise<{stdout: string, stderr: string, code: number | null}>}
 */
function executeAdbCommand(args, deviceId = null) {
  return new Promise((resolve, reject) => {
    const finalArgs = deviceId ? ['-s', deviceId, ...args] : args;
    console.log(`Executing ADB: ${ADB_COMMAND} ${finalArgs.join(' ')}`);

    const process = spawn(ADB_COMMAND, finalArgs, {
      env: { ...process.env, ADB_SERVER_SOCKET: `tcp:${process.env.ADB_HOST || 'localhost'}:${process.env.ADB_PORT || 5037}` }
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`ADB command "${finalArgs.join(' ')}" exited with code ${code}. Stderr: ${stderr}`);
        // For certain errors like "device offline" or "device not found", stderr might be more informative
        // than creating a generic Error object.
        reject({ message: `ADB command failed with code ${code}`, stderr, stdout, code });
      } else {
        resolve({ stdout, stderr, code });
      }
    });

    process.on('error', (err) => {
      console.error(`Failed to start ADB command "${finalArgs.join(' ')}": ${err.message}`);
      reject({ message: `Failed to start ADB process: ${err.message}`, error: err, code: null });
    });
  });
}

/**
 * Parses the output of `adb devices -l`.
 * @param {string} output - The raw string output from the command.
 * @returns {Array<Object>} An array of device objects.
 */
function parseDevicesOutput(output) {
  const devices = [];
  const lines = output.trim().split('\n');
  // Skip the first line "List of devices attached"
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('*') && !line.startsWith('adb server')) { // Ignore daemon messages
      const parts = line.split(/\s+/);
      const serial = parts[0];
      const state = parts[1];
      const details = {};
      if (state !== 'offline' && state !== 'unknown' && state !== 'unauthorized') {
        for (let j = 2; j < parts.length; j++) {
          if (parts[j].includes(':')) {
            const [key, value] = parts[j].split(':', 2);
            details[key] = value;
          }
        }
      }
      devices.push({
        serial,
        state,
        model: details.model || 'Unknown',
        product: details.product || 'Unknown',
        device: details.device || 'Unknown',
        transport_id: details.transport_id || 'Unknown'
      });
    }
  }
  return devices;
}

/**
 * Gets the list of connected ADB devices.
 * @returns {Promise<Array<Object>>}
 */
export async function getDevices() {
  try {
    const { stdout } = await executeAdbCommand(['devices', '-l']);
    return parseDevicesOutput(stdout);
  } catch (error) {
    console.error('Error getting devices:', error.stderr || error.message);
    // If ADB server is not running, it might manifest here.
    // Return an empty array or rethrow based on desired error handling for the API.
    return [];
  }
}

/**
 * Gets detailed properties for a specific device.
 * Mimics some of what `device.getProperties()` from webadb did.
 * @param {string} deviceId
 * @returns {Promise<Object>}
 */
export async function getDeviceProperties(deviceId) {
  if (!deviceId) throw new Error('Device ID is required for getDeviceProperties');
  try {
    const { stdout } = await executeAdbCommand(['shell', 'getprop'], deviceId);
    const properties = {};
    stdout.trim().split('\n').forEach(line => {
      const match = line.match(/^\[(.*?)\]: \[(.*?)\]$/);
      if (match) {
        properties[match[1]] = match[2];
      }
    });
    return properties;
  } catch (error) {
    console.error(`Error getting properties for ${deviceId}:`, error.stderr || error.message);
    throw error; // Rethrow to be handled by the route
  }
}


/**
 * Streams logcat output for a given device.
 * @param {string} deviceId - The serial of the device.
 * @param {string|null} filter - Optional logcat filter string.
 * @param {(line: string) => void} onData - Callback for each log line.
 * @param {(error: Error) => void} onError - Callback for errors.
 * @param {() => void} onClose - Callback when the stream closes.
 * @returns {import('child_process').ChildProcess} The spawned child process.
 */
export function getDeviceLogcat(deviceId, filter, onData, onError, onClose) {
  if (!deviceId) {
    onError(new Error('Device ID is required for logcat.'));
    return null;
  }
  const args = ['logcat'];
  if (filter) {
    args.push(filter); // Simple filter, consider more robust parsing if needed
  }

  const logcatProcess = spawn(ADB_COMMAND, ['-s', deviceId, ...args], {
    env: { ...process.env, ADB_SERVER_SOCKET: `tcp:${process.env.ADB_HOST || 'localhost'}:${process.env.ADB_PORT || 5037}` }
  });

  logcatProcess.stdout.on('data', (data) => {
    data.toString().trim().split('\n').forEach(line => {
      if (line) onData(line);
    });
  });

  logcatProcess.stderr.on('data', (data) => {
    console.error(`Logcat stderr for ${deviceId}: ${data}`);
    // onError(new Error(`Logcat error: ${data}`)); // Decide if stderr always means error for logcat
  });

  logcatProcess.on('error', (err) => {
    console.error(`Failed to start logcat for ${deviceId}:`, err);
    onError(err);
  });

  logcatProcess.on('close', (code) => {
    console.log(`Logcat for ${deviceId} closed with code ${code}`);
    onClose();
  });

  return logcatProcess;
}

/**
 * Executes a shell command on the specified device.
 * @param {string} deviceId
 * @param {string} command
 * @returns {Promise<string>} Resolves with stdout of the command.
 */
export async function executeShellCommand(deviceId, command) {
  if (!deviceId) throw new Error('Device ID is required for shell command');
  if (!command) throw new Error('Command is required');
  try {
    const { stdout, stderr } = await executeAdbCommand(['shell', command], deviceId);
    if (stderr) { // Some commands output to stderr on success (e.g. `pm list packages`)
      console.warn(`Shell command "${command}" on ${deviceId} produced stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing shell command "${command}" on ${deviceId}:`, error.stderr || error.message);
    throw new Error(error.stderr || error.message || 'Failed to execute shell command');
  }
}

/**
 * Reboots the specified device.
 * @param {string} deviceId
 * @param {string} [target] - Optional reboot target (e.g., 'recovery', 'bootloader').
 * @returns {Promise<string>}
 */
export async function rebootDevice(deviceId, target = '') {
  if (!deviceId) throw new Error('Device ID is required for reboot');
  const args = ['reboot'];
  if (target) {
    args.push(target);
  }
  try {
    const { stdout } = await executeAdbCommand(args, deviceId);
    return stdout.trim() || `Device ${deviceId} rebooting into ${target || 'system'}.`;
  } catch (error) {
    console.error(`Error rebooting ${deviceId}:`, error.stderr || error.message);
    throw new Error(error.stderr || error.message || 'Failed to reboot device');
  }
}

/**
 * Installs an APK on the specified device.
 * @param {string} deviceId
 * @param {string} apkPath - Path to the APK file.
 * @param {(progress: string) => void} [onProgress] - Optional callback for progress updates.
 * @returns {Promise<string>}
 */
export async function installApk(deviceId, apkPath, onProgress) {
  // Note: `adb install` doesn't provide granular progress easily.
  // Streaming install with progress is more complex and might require `adb push` + `pm install`.
  // For simplicity, this version won't have granular progress via onProgress from CLI directly.
  // Progress can be simulated or handled via WebSocket if backend pushes updates during a more complex install process.
  if (!deviceId) throw new Error('Device ID is required for APK install');
  if (!apkPath) throw new Error('APK path is required');

  // It's crucial that apkPath is accessible by the backend server.
  // If uploaded, it would be a temporary path on the server.
  console.log(`Attempting to install APK from path: ${apkPath} on device ${deviceId}`);
  if (onProgress) onProgress('Starting installation...');

  try {
    // The '-r' flag allows reinstalling/updating existing apps.
    // The '-g' flag grants all runtime permissions (Android 6.0+).
    const { stdout, stderr } = await executeAdbCommand(['install', '-r', '-g', apkPath], deviceId);

    if (stderr && !stderr.toLowerCase().includes('success')) { // ADB install can output to stderr even on success sometimes
        // Check if stdout also indicates success despite stderr
        if (!stdout.toLowerCase().includes('success')) {
            console.error(`APK Installation stderr for ${deviceId} from ${apkPath}: ${stderr}`);
            throw new Error(stderr.trim() || 'APK installation failed with stderr.');
        }
    }
    if (stdout.toLowerCase().includes('failure')) {
        console.error(`APK Installation stdout failure for ${deviceId} from ${apkPath}: ${stdout}`);
        throw new Error(stdout.trim() || 'APK installation failed.');
    }

    if (onProgress) onProgress('Installation successful.');
    return stdout.trim() || stderr.trim() || 'APK installed successfully.';
  } catch (error) {
    console.error(`Error installing APK on ${deviceId} from ${apkPath}:`, error.message);
    if (onProgress) onProgress(`Error: ${error.message}`);
    throw new Error(error.message || 'Failed to install APK.');
  }
}

/**
 * Takes a screenshot on the specified device and returns its path on the server.
 * @param {string} deviceId
 * @returns {Promise<string>} Path to the screenshot file on the server.
 */
export async function takeScreenshot(deviceId) {
  if (!deviceId) throw new Error('Device ID is required for screenshot');

  // Using /data/local/tmp as it's generally writable.
  const devicePath = `/data/local/tmp/screenshot_${Date.now()}.png`;
  // Store screenshots in a 'temp_files' directory in the backend root. Ensure this dir exists or is created.
  const serverTempDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../temp_files');
  // TODO: Ensure serverTempDir exists. mkdirp or similar.
  const serverPath = path.join(serverTempDir, `screenshot-${deviceId}-${Date.now()}.png`);

  try {
    // Capture screenshot on device
    await executeAdbCommand(['shell', 'screencap', '-p', devicePath], deviceId);
    // Pull screenshot from device to server
    await executeAdbCommand(['pull', devicePath, serverPath], deviceId);
    // Remove screenshot from device
    await executeAdbCommand(['shell', 'rm', devicePath], deviceId);

    return serverPath;
  } catch (error) {
    console.error(`Error taking screenshot on ${deviceId}:`, error.stderr || error.message);
    // Attempt to clean up partial files if error occurs
    try {
      await executeAdbCommand(['shell', 'rm', devicePath], deviceId).catch(() => {}); // Ignore cleanup error
    } catch (cleanupErr) {
        // ignore
    }
    throw new Error(error.stderr || error.message || 'Failed to take screenshot.');
  }
}

// TODO: Add retry/backoff logic for command execution where appropriate.
// This could be a wrapper around executeAdbCommand or integrated within it.
// For example, a function like:
// async function executeAdbWithRetry(args, deviceId, retries = 3, delay = 1000) { ... }
