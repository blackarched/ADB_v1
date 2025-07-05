import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const Terminal = ({ log }) => {
  const endOfLogRef = useRef(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const formatLog = (line) => {
    if (line.includes('[SUCCESS]')) return 'text-green-400';
    if (line.includes('[ERROR]')) return 'text-red-400';
    if (line.includes('[CMD]')) return 'text-yellow-400';
    if (line.includes('[WARN]')) return 'text-orange-400';
    if (line.includes('NEXUS-ADB')) return 'text-pink-400 font-bold';
    return 'text-cyan-300';
  };

  return (
    <Card className="terminal-window h-full flex flex-col">
      <div className="terminal-header">
        <span className="text-green-400 text-sm font-mono">system@nexus-adb:~#</span>
      </div>
      <CardContent className="p-4 bg-black/90 font-mono text-xs flex-grow h-0">
        <div className="space-y-1 h-full overflow-y-auto">
          {log.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className={`whitespace-pre-wrap ${formatLog(line)}`}
            >
              <span className="terminal-text">{line}</span>
            </motion.p>
          ))}
          <div ref={endOfLogRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default Terminal;