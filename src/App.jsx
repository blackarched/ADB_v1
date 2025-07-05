import React from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { useAdb } from '@/hooks/useAdb';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import BackgroundGrid from '@/components/shared/BackgroundGrid';
import { useToast } from '@/components/ui/use-toast';

function App() {
  const adbState = useAdb();
  const { toast } = useToast();

  const handleFeatureClick = (featureName) => {
    toast({
      title: '🚧 Feature Not Implemented 🚧',
      description: `The "${featureName}" feature is not yet available. You can request it in your next prompt! 🚀`,
      variant: 'destructive',
    });
  };

  const adbStateWithActions = { ...adbState, handleFeatureClick };

  return (
    <>
      <Helmet>
        <title>NEXUS-ADB // v2.0 Finalized Interface</title>
        <meta name="description" content="Finalized ADB super tool with an advanced cyberpunk interface, screen mirroring, and extensive device management capabilities." />
      </Helmet>
      
      <div className="min-h-screen text-white font-mono animated-bg">
        <BackgroundGrid />
        <div className="flex h-screen relative z-10">
          <Sidebar adbState={adbStateWithActions} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header adbState={adbStateWithActions} />

            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={adbState.activeTab}
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 0.5 }}
                >
                  <Dashboard adbState={adbStateWithActions} />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;