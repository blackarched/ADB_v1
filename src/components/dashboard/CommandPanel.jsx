import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Power, RefreshCw, LogIn } from 'lucide-react';
import GlitchText from '@/components/shared/GlitchText';

const CommandPanel = ({ adbState }) => {
  const { device, reboot } = adbState;
  const isConnected = !!device;

  const commandButtons = [
    { label: "Reboot", icon: Power, action: () => reboot(), disabled: !isConnected },
    { label: "Recovery", icon: RefreshCw, action: () => reboot('recovery'), disabled: !isConnected },
    { label: "Bootloader", icon: LogIn, action: () => reboot('bootloader'), disabled: !isConnected },
  ];

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="text-green-400 neon-text-green"><GlitchText text="System Commands" /></CardTitle>
        <CardDescription className="text-cyan-300">Core device power controls</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {commandButtons.map(({ label, icon: Icon, action, disabled }) => (
            <Button key={label} className="cyber-button flex-col h-20 text-xs" onClick={action} disabled={disabled}>
              <Icon className="w-5 h-5 mb-2" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
      <div className="corner-bottom-left"></div>
      <div className="corner-bottom-right"></div>
    </Card>
  );
};

export default CommandPanel;