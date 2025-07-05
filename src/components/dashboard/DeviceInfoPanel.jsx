import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, GitBranch, Battery, Wifi, Cpu, HardDrive } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import GlitchText from '@/components/shared/GlitchText';

const InfoLine = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between text-sm py-2 border-b border-cyan-500/10">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon className="w-4 h-4 text-green-400" />
      <span>{label}</span>
    </div>
    <span className="text-pink-400 font-bold text-right truncate">{value || '...'}</span>
  </div>
);

const DeviceInfoPanel = ({ adbState }) => {
  const { deviceInfo } = adbState;

  return (
    <Card className="cyber-card h-full">
      <CardHeader>
        <CardTitle className="text-green-400 neon-text-green"><GlitchText text="Device Telemetry" /></CardTitle>
        <CardDescription className="text-cyan-300">Real-time device diagnostics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoLine icon={Smartphone} label="Model" value={deviceInfo?.model} />
        <InfoLine icon={GitBranch} label="Android OS" value={deviceInfo?.androidVersion} />
        <InfoLine icon={Cpu} label="CPU Usage" value={deviceInfo?.cpu} />
        <InfoLine icon={Wifi} label="IP Address" value={deviceInfo?.ip} />
        
        <div className="pt-2">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                <div className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-green-400" /><span>Memory</span></div>
                <span>{deviceInfo ? `${deviceInfo.memory.used} / ${deviceInfo.memory.total} GB` : 'N/A'}</span>
            </div>
            <Progress value={deviceInfo?.memory.percent || 0} className="h-2 progress-bar-animated" />
        </div>

        <div className="pt-2">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                <div className="flex items-center gap-2"><Battery className="w-4 h-4 text-green-400" /><span>Battery</span></div>
                <span>{deviceInfo ? `${deviceInfo.battery}%` : 'N/A'}</span>
            </div>
            <Progress value={deviceInfo?.battery || 0} className="h-2 progress-bar-animated" />
        </div>
      </CardContent>
      <div className="corner-bottom-left"></div>
      <div className="corner-bottom-right"></div>
    </Card>
  );
};

export default DeviceInfoPanel;