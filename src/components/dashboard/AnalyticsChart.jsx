import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-black/70 border border-purple-500 rounded-lg text-sm">
        <p className="label text-yellow-400">{`${label}`}</p>
        <p className="intro text-white">{`Signal: ${payload[0].value} dBm`}</p>
        <p className="desc text-gray-400">{`Clients: ${payload[0].payload.clients}`}</p>
      </div>
    );
  }
  return null;
};

const AnalyticsChart = ({ liveData }) => {
  const chartData = liveData.map(d => ({ name: d.ssid, signal: d.power, clients: d.clients }));

  return (
    <Card className="cyber-border">
      <CardHeader>
        <CardTitle className="text-yellow-400 neon-text">3D NETWORK VISUALIZATION</CardTitle>
        <CardDescription className="text-purple-300">Live signal strength analysis</CardDescription>
      </CardHeader>
      <CardContent className="scan-line">
        <div className="h-80" style={{ perspective: '1000px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(219, 0, 255, 0.2)" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(219, 0, 255, 0.1)' }} />
              <Bar dataKey="signal" fill="url(#colorSignal)" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f8f840" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#db00ff" stopOpacity={0.8}/>
          </linearGradient>
        </defs>
      </svg>
    </Card>
  );
};

export default AnalyticsChart;