import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSocket } from '@/contexts/SocketContext'; // Import useSocket

export function useAdb() {
  const { socket, isConnected: isSocketConnected } = useSocket(); // Consume socket from context
  const { toast } = useToast();
  const [devices, setDevices] = useState([]); // List of available devices
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null); // Info for the selectedDevice
  const [log, setLog] = useState(['NEXUS-ADB v1.1 Initialized... Waiting for backend connection.']);
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorUrl, setMirrorUrl] = useState(''); // Will be a data URL or blob URL from WebSocket frames
  const [progress, setProgress] = useState({ value: 0, message: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  // const mirrorIntervalRef = useRef(null); // Mirroring will be WebSocket driven

  // Centralized log function, logs will primarily come from WebSocket
  const addLogEntry = useCallback((message, type = 'INFO') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-100), `[${timestamp}] [${type}] ${message}`]); // Increased log buffer
  }, []);

  const fetchDevices = useCallback(async () => {
    addLogEntry('Fetching ADB devices...', 'API');
    try {
      const response = await fetch('/api/adb/devices');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDevices(data.devices || []);
      addLogEntry(`Found ${data.devices?.length || 0} devices.`, 'SUCCESS');
      if (data.devices?.length > 0 && !selectedDevice) {
        // setSelectedDevice(data.devices[0]); // Auto-select first device
        // For now, don't auto-select. User should pick.
         addLogEntry(`Please select a device to connect.`, 'SYSTEM');
      } else if (data.devices?.length === 0) {
        setSelectedDevice(null);
        setDeviceInfo(null);
      }
    } catch (e) {
      addLogEntry(`Failed to fetch devices: ${e.message}`, 'ERROR');
      toast({ title: "Fetch Devices Error", description: e.message, variant: "destructive" });
      setDevices([]);
      setSelectedDevice(null);
      setDeviceInfo(null);
    }
  }, [addLogEntry, toast, selectedDevice]);

  // Simulate selecting a device - in reality, this might trigger more specific subscriptions or backend state changes
  const connectDevice = useCallback(async (deviceSerial) => {
    const deviceToConnect = devices.find(d => d.serial === deviceSerial);
    if (!deviceToConnect) {
        addLogEntry(`Device ${deviceSerial} not found in list. Refreshing...`, 'ERROR');
        fetchDevices(); // Refresh list
        return;
    }
    addLogEntry(`Connecting to ${deviceSerial}...`, 'SYSTEM');
    setSelectedDevice(deviceToConnect); // Optimistically set
    // In a real scenario, backend would confirm connection or provide a dedicated device object/channel
    toast({ title: "Device Selected", description: `Selected ${deviceSerial}. Fetching info...` });
    // Fetch initial device info for the selected device
    // This would eventually be part of a richer connection handshake via API/WebSocket
    // For now, we assume 'getDeviceInfo' will fetch for the 'selectedDevice.serial'
    if (deviceToConnect.serial) {
       await getDeviceInfo(deviceToConnect.serial);
       if (socket && isSocketConnected) {
         addLogEntry(`Requesting logcat for ${deviceToConnect.serial}...`, 'WS');
         socket.emit('subscribe:adb:logcat', { deviceId: deviceToConnect.serial, filter: '' }); // Empty filter for all logs initially
       }
    }
  }, [devices, addLogEntry, toast, fetchDevices, socket, isSocketConnected, getDeviceInfo]); // Added getDeviceInfo to dependencies


  const getDeviceInfo = useCallback(async (serial) => {
    if (!serial) {
      addLogEntry('No device serial provided for getDeviceInfo.', 'WARN');
      return;
    }
    addLogEntry(`Fetching info for ${serial}...`, 'API');
    try {
      // Placeholder: In a real setup, this might be /api/adb/device/:serial/info
      // For now, reusing the /api/adb/devices and finding the specific one, or assuming backend provides full info
      const response = await fetch(`/api/adb/device/${serial}/info`); // Assuming such an endpoint
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDeviceInfo(data); // Expecting full device info object
      addLogEntry(`Device info loaded for ${serial}.`, 'SUCCESS');
    } catch (e) {
      addLogEntry(`Failed to get device info for ${serial}: ${e.message}`, 'ERROR');
      setDeviceInfo(null); // Clear info on error
    }
  }, [addLogEntry]);


  const disconnectDevice = useCallback(async () => {
    if (selectedDevice) {
      addLogEntry(`Disconnecting from ${selectedDevice.serial}...`, 'SYSTEM');
      // TODO: Inform backend if necessary (e.g., to clean up resources or logcat streams)
      // socket.emit('adb:disconnect', { deviceId: selectedDevice.serial });
    }
    setSelectedDevice(null);
    setDeviceInfo(null);
    setIsMirroring(false);
    setMirrorUrl('');
    addLogEntry('Device disconnected/deselected.');
    toast({ title: "Device Disconnected", description: "Connection has been closed or device deselected." });
  }, [selectedDevice, addLogEntry, toast]);

  // Screen mirroring will be handled by WebSocket
  const startMirroring = useCallback(async () => {
    if (!selectedDevice || isMirroring) return;
    if (!socket || !isSocketConnected) {
      addLogEntry('Socket not connected. Cannot start mirroring.', 'ERROR');
      toast({ title: 'Mirroring Error', description: 'Socket not connected.', variant: 'destructive' });
      return;
    }
    addLogEntry(`Requesting screen mirror for ${selectedDevice.serial}...`, 'WS_EMIT');
    socket.emit('adb:start_mirror', { deviceId: selectedDevice.serial });
    // UI state will be updated based on backend confirmation or frames received via 'adb:mirror_frame'
    // For immediate feedback, we can set isMirroring, but it's better if backend confirms.
    // For now, let's assume backend will send frames if successful.
    setIsMirroring(true); // Optimistic update, or wait for backend ack
    addLogEntry('Screen mirror request sent. Waiting for frames...', 'SYSTEM');
  }, [selectedDevice, isMirroring, addLogEntry, socket, isSocketConnected, toast]);

  const stopMirroring = useCallback(() => {
    if (!isMirroring || !selectedDevice) return;
    if (!socket || !isSocketConnected) {
      addLogEntry('Socket not connected. Cannot stop mirroring.', 'ERROR');
      // No toast here as it might be called during cleanup
      setIsMirroring(false); // Still update UI
      setMirrorUrl('');
      return;
    }
    addLogEntry(`Stopping screen mirror for ${selectedDevice.serial}...`, 'WS_EMIT');
    socket.emit('adb:stop_mirror', { deviceId: selectedDevice.serial });
    setIsMirroring(false); // Assume stop is successful or handle confirmation
    setMirrorUrl('');
    addLogEntry('Screen mirror stop request sent.');
  }, [isMirroring, selectedDevice, addLogEntry, socket, isSocketConnected]);

  const takeScreenshot = useCallback(async () => {
    if (!selectedDevice) {
      addLogEntry('No device selected for screenshot.', 'ERROR');
      toast({ title: 'Screenshot Failed', description: 'No device selected.', variant: 'destructive' });
      return;
    }
    addLogEntry(`Taking screenshot for ${selectedDevice.serial}...`, 'API');
    try {
      const response = await fetch(`/api/adb/screenshot/${selectedDevice.serial}`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Screenshot request failed: ${response.status} ${errText}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${selectedDevice.serial}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLogEntry('Screenshot saved.', 'SUCCESS');
      toast({ title: 'Screenshot Saved', description: 'Check your downloads folder.' });
    } catch (e) {
      addLogEntry(`Screenshot failed: ${e.message}`, 'ERROR');
      toast({ title: 'Screenshot Failed', description: e.message, variant: 'destructive' });
    }
  }, [selectedDevice, addLogEntry, toast]);

  const runCommand = useCallback(async (command, successMsg = 'Command executed.', errorMsg = 'Failed to execute command.') => {
    if (!selectedDevice) {
      addLogEntry('No device selected to run command.', 'ERROR');
      toast({ title: 'Command Failed', description: 'No device selected.', variant: 'destructive' });
      return;
    }
    addLogEntry(`Executing on ${selectedDevice.serial}: adb shell ${command}`, 'API');
    try {
      const response = await fetch('/api/adb/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice.serial, command }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Shell command failed: ${response.status}`);
      }
      addLogEntry(`Output for '${command}':\n${result.output}`, 'SHELL_OUTPUT');
      addLogEntry(successMsg, 'SUCCESS');
      toast({ title: 'Command Successful', description: successMsg });
      return result.output;
    } catch (e) {
      addLogEntry(`${errorMsg}: ${e.message}`, 'ERROR');
      toast({ title: 'Command Failed', description: `${errorMsg}: ${e.message}`, variant: 'destructive' });
    }
  }, [selectedDevice, addLogEntry, toast]);

  const reboot = (target = '') => {
    if (!selectedDevice) {
      addLogEntry('No device selected to reboot.', 'ERROR');
      toast({ title: 'Reboot Failed', description: 'No device selected.', variant: 'destructive' });
      return;
    }
    addLogEntry(`Requesting reboot for ${selectedDevice.serial} (target: ${target || 'system'})...`, 'API');
    fetch(`/api/adb/reboot/${selectedDevice.serial}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    })
    .then(async response => {
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Reboot failed: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      addLogEntry(data.message || `Device ${selectedDevice.serial} rebooting into ${target || 'system'}.`, 'SUCCESS');
      toast({ title: 'Reboot Initiated', description: data.message });
    })
    .catch(e => {
      addLogEntry(`Reboot failed: ${e.message}`, 'ERROR');
      toast({ title: 'Reboot Failed', description: e.message, variant: 'destructive' });
    });
  };

  const installApk = async (file) => {
    if (!selectedDevice) {
      addLogEntry('No device selected for APK install.', 'ERROR');
      toast({ title: 'Install Failed', description: 'No device selected.', variant: 'destructive' });
      return;
    }
    if (!file) {
      addLogEntry('No APK file selected.', 'ERROR');
      toast({ title: 'Install Failed', description: 'No APK file selected.', variant: 'destructive' });
      return;
    }

    addLogEntry(`Installing APK: ${file.name} on ${selectedDevice.serial}`, 'API');
    setProgress({ value: 0, message: `Starting installation of ${file.name}...` });

    const formData = new FormData();
    formData.append('apk', file);
    // formData.append('deviceId', selectedDevice.serial); // Or send as path param

    try {
      // This requires a backend that can handle file uploads and then stream to adb install
      // For now, simulating progress as this is complex without full backend
      // const response = await fetch(`/api/adb/install/${selectedDevice.serial}`, {
      //   method: 'POST',
      //   body: formData,
      //   // Note: For actual progress, backend would need to stream progress updates via WebSocket
      // });
      
      // Simulate upload & install for now
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 100) {
          setProgress({ value: currentProgress, message: `Installing: ${currentProgress}%` });
        } else {
          clearInterval(progressInterval);
          addLogEntry(`APK ${file.name} installed (simulated).`, 'SUCCESS');
          toast({ title: 'Install Successful', description: `Installed ${file.name} (simulated)` });
          setProgress({ value: 100, message: 'Installation complete!' });
          setTimeout(() => setProgress({ value: 0, message: '' }), 3000);
        }
      }, 200);


      // if (!response.ok) {
      //   const err = await response.json();
      //   throw new Error(err.error || 'APK installation failed');
      // }
      // const result = await response.json();
      // addLogEntry(result.message || `APK ${file.name} installed.`, 'SUCCESS');
      // toast({ title: 'Install Successful', description: result.message });
      // setProgress({ value: 100, message: 'Installation complete!' });

    } catch (e) {
      addLogEntry(`APK installation failed: ${e.message}`, 'ERROR');
      toast({ title: 'Install Failed', description: e.message, variant: 'destructive' });
      setProgress({ value: 0, message: 'Installation failed!' });
    }
  };

  // Initial fetch of devices and general socket status logging
  useEffect(() => {
    if (isSocketConnected) {
      addLogEntry('Socket connected to backend.', 'SYSTEM_GREEN');
      fetchDevices();
    } else {
      addLogEntry('Socket disconnected. Waiting to connect...', 'SYSTEM_RED');
      // Clear device related data if socket disconnects
      setDevices([]);
      setSelectedDevice(null);
      setDeviceInfo(null);
      setIsMirroring(false);
      setMirrorUrl('');
    }
  }, [isSocketConnected, fetchDevices, addLogEntry]);

  // WebSocket listeners for ADB specific events
  useEffect(() => {
    if (!socket || !isSocketConnected) {
      // Clear listeners if socket is not available or not connected
      // This might be redundant if SocketProvider handles listener cleanup on disconnect,
      // but explicit cleanup here ensures hook-specific listeners are removed.
      return () => {};
    }

    const handleLogcat = (logLine) => {
      if (logLine.deviceId === selectedDevice?.serial) { // Only process logs for the selected device
        addLogEntry(logLine.line, `LOGCAT`);
      }
    };
    const handleMirrorFrame = ({ deviceId, frame }) => {
      if (selectedDevice?.serial === deviceId && isMirroring) {
        setMirrorUrl(frame); // Assuming frame is a data URL (e.g., 'data:image/jpeg;base64,...')
      }
    };
    const handleDeviceUpdate = () => { // Backend could push this if devices change significantly
      addLogEntry('Device list updated by backend.', 'SYSTEM');
      fetchDevices();
    };
     const handleLogcatError = ({ deviceId, error }) => {
      if (selectedDevice?.serial === deviceId) {
        addLogEntry(`Logcat stream error: ${error}`, 'ERROR');
        toast({ title: 'Logcat Error', description: error, variant: 'destructive' });
      }
    };
    const handleLogcatClosed = ({ deviceId }) => {
      if (selectedDevice?.serial === deviceId) {
        addLogEntry('Logcat stream closed by backend.', 'SYSTEM');
      }
    };


    socket.on('adb:logcat', handleLogcat);
    socket.on('adb:mirror_frame', handleMirrorFrame);
    socket.on('adb:device_update', handleDeviceUpdate); // Example: if backend pushes device list changes
    socket.on('adb:logcat:error', handleLogcatError);
    socket.on('adb:logcat:closed', handleLogcatClosed);

    // Logcat subscription logic is now part of connectDevice or a dedicated function
    // For mirroring, startMirroring will emit the request

    return () => {
      socket.off('adb:logcat', handleLogcat);
      socket.off('adb:mirror_frame', handleMirrorFrame);
      socket.off('adb:device_update', handleDeviceUpdate);
      socket.off('adb:logcat:error', handleLogcatError);
      socket.off('adb:logcat:closed', handleLogcatClosed);
    };
  }, [socket, isSocketConnected, addLogEntry, selectedDevice, isMirroring, fetchDevices, toast]);

  // Update device info periodically if a device is selected and socket is connected
  useEffect(() => {
    let intervalId;
    if (selectedDevice?.serial) {
      getDeviceInfo(selectedDevice.serial); // Initial fetch
      intervalId = setInterval(() => {
        getDeviceInfo(selectedDevice.serial);
      }, 15000); // Refresh device info less frequently, e.g., every 15s
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedDevice?.serial, getDeviceInfo]);


  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    devices, // List of all available devices
    selectedDevice, // Currently selected device object
    deviceInfo,
    log,
    isMirroring,
    mirrorUrl,
    progress,
    activeTab,
    currentTime,
    connectDevice, // Takes device serial
    disconnectDevice,
    fetchDevices, // To manually refresh device list
    startMirroring,
    stopMirroring,
    takeScreenshot,
    reboot,
    installApk,
    runCommand,
    setActiveTab,
    addLog: addLogEntry, // Renamed for clarity
  };
}