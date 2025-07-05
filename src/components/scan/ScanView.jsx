import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Wifi, BarChart, Users } from 'lucide-react';

const ScanView = ({ isScanning, scanProgress, startNetworkScan, networkData, handleFeatureClick }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 neon-text">Network Scanner</h2>
          <p className="text-purple-300">Discover and analyze nearby wireless networks</p>
        </div>
        <Button onClick={startNetworkScan} disabled={isScanning} className="cyber-button">
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>
      </div>

      {isScanning && (
        <Card className="cyber-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Scan Progress</span>
              <span className="text-sm text-yellow-400">{Math.round(scanProgress)}%</span>
            </div>
            <Progress value={scanProgress} className="h-2 progress-animated" />
          </CardContent>
        </Card>
      )}

      <Card className="cyber-border">
        <CardHeader>
          <CardTitle className="text-green-400">Discovered Networks</CardTitle>
          <CardDescription>Found {networkData.length} wireless networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networkData.map((network, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-12 items-center p-4 cyber-border rounded-lg hover:bg-purple-500/10 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-4">
                  <div className={`status-indicator ${
                    network.status === 'vulnerable' ? 'status-vulnerable' : 'status-secure'
                  }`}></div>
                  <div>
                    <div className="font-medium text-white">{network.ssid}</div>
                    <div className="text-xs text-gray-400">{network.bssid}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{network.channel}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{network.power} dBm</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">{network.clients}</span>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Badge variant={network.encryption === 'Open' ? 'destructive' : 'default'}>
                    {network.encryption}
                  </Badge>
                  <Button size="sm" className="cyber-button" onClick={() => handleFeatureClick('target')}>
                    Target
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanView;