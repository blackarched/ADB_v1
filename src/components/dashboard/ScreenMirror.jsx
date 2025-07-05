import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Video, VideoOff, Smartphone, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlitchText from '@/components/shared/GlitchText';

const ScreenMirror = ({ adbState }) => {
  const { device, isMirroring, mirrorUrl, startMirroring, stopMirroring, takeScreenshot } = adbState;

  return (
    <Card className="cyber-card aspect-video flex flex-col">
      <CardHeader>
        <CardTitle className="text-green-400 neon-text-green"><GlitchText text="Live Screen Feed" /></CardTitle>
        <CardDescription className="text-cyan-300">Real-time device visual interface</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center bg-black/50 rounded-b-lg overflow-hidden relative p-0">
        <AnimatePresence>
          {mirrorUrl && isMirroring && (
            <motion.img
              key={mirrorUrl}
              src={mirrorUrl}
              alt="Device Screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="object-contain h-full w-full"
            />
          )}
        </AnimatePresence>
        
        {!device && (
          <div className="text-center z-10 flex flex-col items-center gap-4">
            <Smartphone className="w-16 h-16 text-cyan-500/30" />
            <p className="text-cyan-300">Awaiting Cybernetic Link</p>
          </div>
        )}
        
        {device && !isMirroring && (
           <div className="text-center z-10 flex flex-col items-center gap-4">
            <Monitor className="w-16 h-16 text-cyan-500/30" />
            <p className="text-cyan-300">Visual Feed Offline</p>
          </div>
        )}

        {device && (
          <div className="absolute bottom-4 right-4 z-20 flex gap-2">
            <Button
              className="cyber-button"
              onClick={takeScreenshot}
              disabled={!isMirroring}
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            <Button
              className="cyber-button"
              onClick={isMirroring ? stopMirroring : startMirroring}
              disabled={!device}
            >
              {isMirroring ? <VideoOff className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
              {isMirroring ? 'Disable Feed' : 'Enable Feed'}
            </Button>
          </div>
        )}
      </CardContent>
      <div className="corner-bottom-left"></div>
      <div className="corner-bottom-right"></div>
    </Card>
  );
};

export default ScreenMirror;