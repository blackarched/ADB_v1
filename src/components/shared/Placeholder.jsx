import React from 'react';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

const Placeholder = ({ onBack }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8 cyber-border rounded-lg">
        <Construction className="w-16 h-16 mx-auto mb-4 text-yellow-400 neon-text" />
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Module Under Development</h2>
        <p className="text-purple-300">This pentesting module is being forged in the digital fires. Check back soon!</p>
        <Button className="mt-6 cyber-button" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Placeholder;