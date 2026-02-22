import { motion } from 'framer-motion';
import { Zap, Timer, Activity, Database } from 'lucide-react';
import CountUp from 'react-countup';
import { useSimulation } from '../context/SimulationContext';
import './AlgorithmStats.css';

export const AlgorithmStats = () => {
    const { stats, status, activeAlgorithm, battery, maxBattery, autoAlgorithm, autoReasoning } = useSimulation();

    const batteryPercentage = maxBattery > 0 ? (battery / maxBattery) * 100 : 0;

    return (
        <div className="algorithm-stats glass-panel">
            <div className="panel-header">
                <h3 className="neon-text-blue">Live Telemetry</h3>
                <div className={`status-indicator ${status !== 'IDLE' ? 'active' : ''}`} />
            </div>

            <div className="stats-grid">
                <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <div className="stat-header">
                        <Zap className="stat-icon neon-text-purple" size={18} />
                        <span className="stat-label">Battery Level</span>
                    </div>
                    <div className="stat-value text-gradient">
                        <CountUp end={batteryPercentage} duration={2} preserveValue={true} />
                        <span className="stat-unit">%</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <div className="stat-header">
                        <Timer className="stat-icon neon-text-blue" size={18} />
                        <span className="stat-label">Execution Time</span>
                    </div>
                    <div className="stat-value text-gradient">
                        <CountUp end={stats.time} duration={2} decimals={2} preserveValue={true} />
                        <span className="stat-unit">ms</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <div className="stat-header">
                        <Activity className="stat-icon neon-text-purple" size={18} />
                        <span className="stat-label">Path Cost</span>
                    </div>
                    <div className="stat-value text-gradient">
                        <CountUp end={stats.pathCost} duration={2} decimals={1} preserveValue={true} />
                        <span className="stat-unit">m</span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <div className="stat-header">
                        <Database className="stat-icon neon-text-blue" size={18} />
                        <span className="stat-label">Nodes Expanded</span>
                    </div>
                    <div className="stat-value text-gradient">
                        <CountUp end={stats.nodesExpanded} duration={2} separator="," preserveValue={true} />
                        <span className="stat-unit"></span>
                    </div>
                </motion.div>

                <motion.div
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    <div className="stat-header">
                        <svg
                            className="stat-icon neon-text-purple"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            width={18} height={18}
                        >
                            <polyline points="9 10 4 15 9 20"></polyline>
                            <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                        </svg>
                        <span className="stat-label">Turns Taken</span>
                    </div>
                    <div className="stat-value text-gradient">
                        <CountUp end={stats.turns} duration={2} preserveValue={true} />
                        <span className="stat-unit"></span>
                    </div>
                </motion.div>
            </div>

            <div className="algorithm-legend" style={{ position: 'relative' }}>
                <h4 className="legend-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Active Algorithm
                    {autoAlgorithm && <span className="neon-text-blue" style={{ fontSize: '0.7em', padding: '0.2rem 0.5rem', background: 'rgba(0,240,255,0.1)', borderRadius: '4px' }}>AUTO</span>}
                </h4>
                {autoAlgorithm && autoReasoning && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                        {autoReasoning}
                    </div>
                )}
                <div className="legend-items">
                    <div className={`legend-item ${activeAlgorithm === 'A*' ? 'active' : 'inactive'}`}>
                        <span className="legend-color a-star" />
                        <span className="legend-label">A* Search</span>
                    </div>
                    <div className={`legend-item ${activeAlgorithm === 'HPA*' ? 'active' : 'inactive'}`}>
                        <span className="legend-color hpa-star" />
                        <span className="legend-label">Hierarchical (HPA*)</span>
                    </div>
                    <div className={`legend-item ${activeAlgorithm === 'GA' ? 'active' : 'inactive'}`}>
                        <span className="legend-color ga" />
                        <span className="legend-label">Hybrid GA</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
