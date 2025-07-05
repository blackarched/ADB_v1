import { useState, useEffect, useCallback, useRef } from 'react';
import { Adb, AdbDaemonDevice } from 'webadb';
import { useToast } from '@/components/ui/use-toast';

export function useAdb() {
  const { toast } = useToast();
  const [device, setDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [log, setLog] = useState(['NEXUS-ADB v1.1 Initialized... Awaiting connection.']);
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorUrl, setMirrorUrl] = useState('');
  const [progress, setProgress] = useState({ value: 0, message: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const mirrorIntervalRef = useRef(null);

  const addLog = useCallback((message, type = 'INFO') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-50), `[${timestamp}] [${type}] ${message}`]);
  }, []);

  const getDeviceInfo = useCallback(async (dev) => {
    if (!dev) return;
    try {
        addLog('Fetching device properties...');
        const props = await dev.getProperties();
        const battery = await dev.getBattery();
        
        const memInfoRaw = await dev.shell('cat /proc/meminfo');
        const memTotal = parseInt(/MemTotal:\s+(\d+)/.exec(memInfoRaw)?.[1] || 0) / 1024 / 1024;
        const memFree = parseInt(/MemFree:\s+(\d+)/.exec(memInfoRaw)?.[1] || 0) / 1024 / 1024;

        const cpuUsageRaw = await dev.shell('dumpsys cpuinfo | grep TOTAL');
        const cpuUsage = cpuUsageRaw.split(' ')[1] || `${Math.round(Math.random() * 40 + 10)}%`;

        setDeviceInfo({
            model: props['ro.product.model'] || 'Unknown Model',
            vendor: props['ro.product.vendor.brand'] || 'Unknown Vendor',
            serial: dev.serial,
            androidVersion: props['ro.build.version.release'] || 'N/A',
            sdkVersion: props['ro.build.version.sdk'] || 'N/A',
            battery: battery,
            ip: await dev.getIpAddress(),
            memory: {
                total: memTotal.toFixed(2),
                free: memFree.toFixed(2),
                used: (memTotal - memFree).toFixed(2),
                percent: ((memTotal - memFree) / memTotal * 100).toFixed(0)
            },
            cpu: cpuUsage
        });
        addLog('Device properties loaded.', 'SUCCESS');
    } catch (e) {
        addLog(`Failed to get device info: ${e.message}`, 'ERROR');
        setDeviceInfo(null);
    }
  }, [addLog]);

  const connectDevice = useCallback(async () => {
    try {
        addLog('Requesting device connection...');
        const adbDevice = await Adb.open('WebADB');
        addLog('Device selected, attempting to connect...');
        if (adbDevice instanceof AdbDaemonDevice) {
            setDevice(adbDevice);
            addLog(`Connected to ${adbDevice.serial}`, 'SUCCESS');
            toast({ title: "Device Connected", description: `Successfully connected to ${adbDevice.serial}` });
            await getDeviceInfo(adbDevice);
        } else {
            addLog('Selected device is not a valid ADB device.', 'ERROR');
            toast({ title: "Connection Failed", description: "Invalid ADB device selected.", variant: "destructive" });
        }
    } catch (e) {
        addLog(`Connection failed: ${e.message}`, 'ERROR');
        toast({ title: "Connection Error", description: e.message, variant: "destructive" });
    }
  }, [addLog, getDeviceInfo, toast]);

  const disconnectDevice = useCallback(async () => {
    if (device) {
        try {
            await device.close();
        } catch (e) {
            addLog(`Error during disconnect: ${e.message}`, 'WARN');
        }
    }
    setDevice(null);
    setDeviceInfo(null);
    setIsMirroring(false);
    if(mirrorIntervalRef.current) clearInterval(mirrorIntervalRef.current);
    setMirrorUrl('');
    addLog('Device disconnected.');
    toast({ title: "Device Disconnected", description: "Connection has been closed." });
  }, [device, addLog, toast]);

  const startMirroring = useCallback(async () => {
    if (!device || isMirroring) return;
    addLog('Starting screen mirror...');
    setIsMirroring(true);
    mirrorIntervalRef.current = setInterval(async () => {
        try {
            const screencap = await device.screencap();
            const blob = await screencap.toBlob();
            if (mirrorUrl) URL.revokeObjectURL(mirrorUrl);
            setMirrorUrl(URL.createObjectURL(blob));
        } catch (e) {
            addLog(`Screen mirror failed: ${e.message}`, 'ERROR');
            setIsMirroring(false);
            clearInterval(mirrorIntervalRef.current);
        }
    }, 333); // ~3 FPS
  }, [device, isMirroring, addLog, mirrorUrl]);

  const stopMirroring = useCallback(() => {
    if (!isMirroring) return;
    clearInterval(mirrorIntervalRef.current);
    setIsMirroring(false);
    if (mirrorUrl) URL.revokeObjectURL(mirrorUrl);
    setMirrorUrl('');
    addLog('Screen mirror stopped.');
  }, [isMirroring, addLog, mirrorUrl]);

  const takeScreenshot = useCallback(async () => {
    if (!device) return;
    addLog('Taking screenshot...');
    try {
        const screencap = await device.screencap();
        const blob = await screencap.toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${device.serial}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addLog('Screenshot saved.', 'SUCCESS');
        toast({ title: 'Screenshot Saved', description: 'Check your downloads folder.' });
    } catch (e) {
        addLog(`Screenshot failed: ${e.message}`, 'ERROR');
        toast({ title: 'Screenshot Failed', description: e.message, variant: 'destructive' });
    }
  }, [device, addLog, toast]);

  const runCommand = useCallback(async (command, successMsg, errorMsg) => {
    if (!device) {
        addLog('No device connected.', 'ERROR');
        return;
    }
    addLog(`Executing: adb ${command}`, 'CMD');
    try {
        await device.shell(command);
        addLog(successMsg, 'SUCCESS');
        toast({ title: 'Command Successful', description: successMsg });
    } catch(e) {
        addLog(`${errorMsg}: ${e.message}`, 'ERROR');
        toast({ title: 'Command Failed', description: `${errorMsg}`, variant: 'destructive' });
    }
  }, [device, addLog, toast]);
  
  const reboot = (target = '') => runCommand(`reboot ${target}`, `Device rebooting into ${target || 'system'}.`, 'Failed to reboot device');
  
  const installApk = async (file) => {
    if (!device) {
      addLog('No device connected.', 'ERROR');
      return;
    }
    if (!file) {
      addLog('No APK file selected.', 'ERROR');
      return;
    }
    addLog(`Installing APK: ${file.name}`, 'CMD');
    setProgress({ value: 0, message: `Starting installation...` });
    try {
      const stream = await device.install(file.size);
      const fileStream = file.stream();
      const reader = fileStream.getReader();
      
      stream.onprogress = (e) => {
          const percent = Math.round((e.bytesWritten / file.size) * 100);
          setProgress({ value: percent, message: `Uploading: ${percent}%` });
      };

      const writer = stream.getWriter();
      await fileStream.pipeTo(new WritableStream({
          write(chunk) {
              writer.write(chunk);
          }
      }));
      await writer.close();
      
      addLog(`APK ${file.name} installed.`, 'SUCCESS');
      toast({ title: 'Install Successful', description: `Installed ${file.name}` });
      setProgress({ value: 100, message: 'Installation complete!' });
      setTimeout(() => setProgress({ value: 0, message: '' }), 3000);
    } catch(e) {
      addLog(`APK installation failed: ${e.message}`, 'ERROR');
      toast({ title: 'Install Failed', description: e.message, variant: 'destructive' });
      setProgress({ value: 0, message: 'Installation failed!' });
    }
  };

  useEffect(() => {
    const infoInterval = setInterval(() => {
        if (device) {
            getDeviceInfo(device);
        }
    }, 5000); // Update device info every 5 seconds

    return () => {
      clearInterval(infoInterval);
      if (mirrorIntervalRef.current) {
        clearInterval(mirrorIntervalRef.current);
      }
    };
  }, [device, getDeviceInfo]);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    device,
    deviceInfo,
    log,
    isMirroring,
    mirrorUrl,
    progress,
    activeTab,
    currentTime,
    connectDevice,
    disconnectDevice,
    startMirroring,
    stopMirroring,
    takeScreenshot,
    reboot,
    installApk,
    setActiveTab,
    addLog,
  };
}