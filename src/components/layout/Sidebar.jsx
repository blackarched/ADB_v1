import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Smartphone, Terminal, HardDrive, Cpu, Battery, DownloadCloud, Monitor, Settings 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import GlitchText from '@/components/shared/GlitchText';

const sidebarItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'commands', icon: Terminal, label: 'Commands' },
    { id: 'files', icon: HardDrive, label: 'File Manager' },
    { id: 'apps', icon: DownloadCloud, label: 'App Manager' },
    { id: 'mirror', icon: Monitor, label: 'Screen Mirror' },
    { id: 'settings', icon: Settings, label: 'Settings' }
];

const Sidebar = ({ adbState }) => {
  const { activeTab, setActiveTab, deviceInfo } = adbState;

  const StatItem = ({ icon: Icon, label, value }) => (
     <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Icon className="w-3 h-3 text-blue-400"/>
          <span>{label}</span>
        </div>
        <span className="text-purple-300 font-semibold">{value || 'N/A'}</span>
      </div>
  );

  return (
    <motion.div 
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="w-64 bg-black/50 backdrop-blur-lg border-r border-blue-500/20 p-4 flex flex-col shrink-0"
    >
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-6 h-6 text-yellow-400 neon-text" />
          <GlitchText text="NEXUS-ADB" className="text-yellow-400 font-bold text-lg neon-text" />
        </div>
        <p className="text-purple-300 text-sm">v1.1 - Cybernetic Interface</p>
      </div>

      <nav className="space-y-2 flex-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 5, backgroundColor: 'rgba(0, 212, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-500/20 border border-blue-500/50 text-yellow-400' 
                  : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="font-medium">{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="mt-8 p-4 cyber-card">
        <div className="flex items-center gap-2 mb-2">
           <div className={`status-indicator ${deviceInfo ? 'status-connected' : 'status-disconnected'}`}></div>
          <span className="text-green-400 text-sm font-semibold">DEVICE CORE</span>
        </div>
        <div className="space-y-2 text-xs">
           <StatItem icon={Smartphone} label="Model" value={deviceInfo?.model} />
           <StatItem icon={Cpu} label="CPU" value={deviceInfo?.cpu} />
           <div className="pt-1">
             <div className="flex items-center justify-between text-gray-400 mb-1 text-xs">
                <div className="flex items-center gap-2"><HardDrive className="w-3 h-3 text-blue-400"/><span>Memory</span></div>
                <span>{deviceInfo?.memory?.used || 'N/A'} / {deviceInfo?.memory?.total || 'N/A'} GB</span>
             </div>
             <Progress value={deviceInfo?.memory?.percent || 0} className="h-2 progress-bar-animated" />
           </div>
           <div className="pt-1">
             <div className="flex items-center justify-between text-gray-400 mb-1 text-xs">
                <div className="flex items-center gap-2"><Battery className="w-3 h-3 text-blue-400"/><span>Battery</span></div>
                <span>{deviceInfo?.battery || 'N/A'}%</span>
             </div>
             <Progress value={deviceInfo?.battery || 0} className="h-2 progress-bar-animated" />
           </div>
        </div>
        <div className="corner-bottom-left"></div>
        <div className="corner-bottom-right"></div>
      </div>
    </motion.div>
  );
};

export default Sidebar;