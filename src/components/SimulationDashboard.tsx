import { motion } from 'framer-motion';
import { SimulationControls } from './SimulationControls';
import { AlgorithmStats } from './AlgorithmStats';
import { InteractiveMap } from './InteractiveMap';
import { ArrowLeft } from 'lucide-react';
import './SimulationDashboard.css';

interface SimulationDashboardProps {
    onBack: () => void;
    onViewAnalytics?: () => void;
}

export const SimulationDashboard = ({ onBack, onViewAnalytics }: SimulationDashboardProps) => {
    return (
        <motion.div
            className="dashboard-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, type: 'spring' }}
        >
            <header className="dashboard-header glass-panel">
                <button className="back-btn neon-text-blue" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Mission Control</span>
                </button>
                <h2 className="title text-gradient">UAV Path Optimizer</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {onViewAnalytics && (
                        <button className="open-analytics-btn" onClick={onViewAnalytics}>
                            View Analytics
                        </button>
                    )}
                    <div className="status-indicator">
                        <span className="status-dot online" /> System Nominal
                    </div>
                </div>
            </header>

            <div className="dashboard-grid">
                <aside className="panel-left">
                    <SimulationControls />
                </aside>

                <main className="panel-center glass-panel map-wrapper">
                    <InteractiveMap />
                </main>

                <aside className="panel-right">
                    <AlgorithmStats />
                </aside>
            </div>

        </motion.div>
    );
};
