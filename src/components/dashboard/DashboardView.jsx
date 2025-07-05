import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import PentestControlPanel from '@/components/dashboard/PentestControlPanel';
import Terminal from '@/components/dashboard/Terminal';
import HandshakeList from '@/components/dashboard/HandshakeList';
import { Network, Zap, Target, Unlock } from 'lucide-react';

const DashboardView = ({
  networkStats,
  pentestControls,
  togglePentestControl,
  terminalOutput,
  handshakeData,
  handleFeatureClick,
  liveChartData
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Network} title="NETWORKS FOUND" value={networkStats.networksFound} color="green" />
        <StatCard icon={Zap} title="HANDSHAKES CAPTURED" value={networkStats.handshakesCaptured} color="blue" />
        <StatCard icon={Target} title="DEAUTH ATTACKS" value={networkStats.deauthAttacks} color="purple" />
        <StatCard icon={Unlock} title="CRACKING SESSIONS" value={networkStats.crackingSessions} color="red" />
      </div>

      <AnalyticsChart liveData={liveChartData} />
      
      <PentestControlPanel
        controls={pentestControls}
        toggleControl={togglePentestControl}
        handleFeatureClick={handleFeatureClick}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Terminal output={terminalOutput} />
        <HandshakeList handshakes={handshakeData} handleFeatureClick={handleFeatureClick} />
      </div>
    </div>
  );
};

export default DashboardView;