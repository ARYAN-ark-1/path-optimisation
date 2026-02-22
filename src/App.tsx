import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ParticleBackground } from './components/ParticleBackground';
import { AnimatedGridMap } from './components/AnimatedGridMap';
import { HeroSection } from './components/HeroSection';
import { SimulationDashboard } from './components/SimulationDashboard';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { CustomCursor } from './components/CustomCursor';

export type ViewState = 'landing' | 'dashboard' | 'analytics';

function App() {
  const [view, setView] = useState<ViewState>('landing');

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
      <CustomCursor />
      {/* Background Layers - these persist across views */}
      <ParticleBackground />
      {view === 'landing' && <AnimatedGridMap />}

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            <HeroSection onStart={() => setView('dashboard')} />
          </motion.div>
        )}

        {view === 'dashboard' && (
          <SimulationDashboard
            key="dashboard"
            onBack={() => setView('landing')}
            onViewAnalytics={() => setView('analytics')}
          />
        )}

        {view === 'analytics' && (
          <PerformanceAnalytics
            key="analytics"
            onBack={() => setView('dashboard')}
          />
        )}
      </AnimatePresence>

      {/* Decorative Grid Overlay for texture */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, transparent 0%, rgba(5, 11, 20, 0.8) 100%)',
        pointerEvents: 'none',
        zIndex: 5
      }} />
    </div>
  );
}

export default App;
