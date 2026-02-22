import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { FitnessChart } from './FitnessChart';
import { EnergyChart } from './EnergyChart';
import { ComparisonTable } from './ComparisonTable';
import { useSimulation } from '../context/SimulationContext';
import './PerformanceAnalytics.css';

interface PerformanceAnalyticsProps {
    onBack: () => void;
}

export const PerformanceAnalytics = ({ onBack }: PerformanceAnalyticsProps) => {
    const { comparisonStats } = useSimulation();

    const panelVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <motion.div
            className="analytics-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, type: 'spring' }}
        >
            <div className="animated-gradient-bg" />

            <header className="dashboard-header glass-panel">
                <button className="back-btn neon-text-purple" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Simulation Dashboard</span>
                </button>
                <h2 className="title text-gradient">Performance Analytics</h2>
                <div className="status-indicator">
                    <span className="status-dot online" /> Data Synced
                </div>
            </header>

            <div className="analytics-grid">
                <motion.div
                    className="chart-panel glass-panel"
                    variants={panelVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    <h3 className="neon-text-blue">GA Cost Evolution</h3>
                    <FitnessChart data={comparisonStats} />
                </motion.div>

                <motion.div
                    className="chart-panel glass-panel"
                    variants={panelVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="neon-text-blue">Energy Consumption (kJ)</h3>
                    <EnergyChart data={comparisonStats} />
                </motion.div>

                <motion.div
                    className="table-panel glass-panel"
                    variants={panelVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: 0.4 }}
                >
                    <h3 className="neon-text-blue">Algorithm Comparison</h3>
                    <ComparisonTable data={comparisonStats} />
                </motion.div>
            </div>
        </motion.div>
    );
};
