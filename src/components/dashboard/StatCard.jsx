import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400'
  };

  return (
    <motion.div whileHover={{ y: -5, scale: 1.05 }} className="h-full">
      <Card className="cyber-border h-full pulse-glow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            <Icon className={`w-4 h-4 ${colors[color]}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colors[color]} neon-text`}>{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;