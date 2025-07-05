import React from 'react';
import DeviceInfoPanel from '@/components/dashboard/DeviceInfoPanel';
import ScreenMirror from '@/components/dashboard/ScreenMirror';
import CommandPanel from '@/components/dashboard/CommandPanel';
import Terminal from '@/components/dashboard/Terminal';
import InstallPanel from '@/components/dashboard/InstallPanel';

const Dashboard = ({ adbState }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScreenMirror adbState={adbState} />
        </div>
        <div>
          <DeviceInfoPanel adbState={adbState} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <Terminal log={adbState.log} />
        </div>
        <div className="space-y-6">
            <CommandPanel adbState={adbState} />
            <InstallPanel adbState={adbState} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;