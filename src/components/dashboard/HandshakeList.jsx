import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const HandshakeList = ({ handshakes, handleFeatureClick }) => {
  return (
    <Card className="cyber-border">
      <CardHeader>
        <CardTitle className="text-blue-400 neon-text">CAPTURED HANDSHAKES</CardTitle>
        <CardDescription className="text-gray-400">Captured authentication data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {handshakes.map((handshake, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 cyber-border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`status-indicator ${
                  handshake.status === 'complete' ? 'status-active' :
                  handshake.status === 'partial' ? 'status-vulnerable' : 'bg-red-500'
                }`}></div>
                <div>
                  <div className="font-medium text-white">{handshake.target}</div>
                  <div className="text-xs text-gray-400">{handshake.bssid}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={handshake.quality === 'excellent' ? 'default' : 
                              handshake.quality === 'good' ? 'secondary' : 'destructive'}>
                  {handshake.quality}
                </Badge>
                <div className="text-sm text-gray-400">{handshake.captured}</div>
                <Button size="sm" className="cyber-button" onClick={() => handleFeatureClick('crack')}>
                  Crack
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HandshakeList;