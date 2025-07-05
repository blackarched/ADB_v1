import React from 'react';
import { motion } from 'framer-motion';

const Hud = () => {
  return (
    <>
      {/* Corners */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="hud-corner top-0 left-0 border-t-2 border-l-2"></motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="hud-corner top-0 right-0 border-t-2 border-r-2"></motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="hud-corner bottom-0 left-0 border-b-2 border-l-2"></motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="hud-corner bottom-0 right-0 border-b-2 border-r-2"></motion.div>
      {/* Scan line effect */}
      <motion.div 
        className="hud-line h-px w-full left-0"
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      ></motion.div>
    </>
  );
};

export default Hud;