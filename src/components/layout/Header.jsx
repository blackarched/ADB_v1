import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Clock, WifiOff, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlitchText from '@/components/shared/GlitchText';

const Header = ({ adbState }) => {
  const { device, currentTime, connectDevice, disconnectDevice } = adbState;

  return (
    <motion.header 
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="bg-black/30 backdrop-blur-lg border-b border-cyan-500/20 p-4 shrink-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-green-400 animate-pulse" />
            <GlitchText text="NEXUS-ADB" className="text-xl font-bold text-green-400 neon-text-green" />
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {device ? (
            <div className="flex items-center gap-2 text-green-400">
              <div className="status-indicator status-connected"></div>
              <span className="hidden md:inline">{`UID: ${device.serial}`}</span>
              <span className="md:hidden">LINKED</span>
            </div>
          ) : (
             <div className="flex items-center gap-2 text-red-400">
              <div className="status-indicator status-disconnected"></div>
              <span className="hidden md:inline">NO LINK</span>
               <span className="md:hidden">OFFLINE</span>
            </div>
          )}
          
          <Button 
            size="sm" 
            className="cyber-button"
            onClick={device ? disconnectDevice : connectDevice}
          >
            {device ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
            {device ? 'Terminate' : 'Link'}
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;