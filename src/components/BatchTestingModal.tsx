import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, BarChart2, Activity } from 'lucide-react';
import { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import './BatchTestingModal.css';

export const BatchTestingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { runBatchTest, maxBattery } = useSimulation();
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);

    const startTest = async () => {
        setIsRunning(true);
        setResults(null);
        try {
            // Small timeout to allow UI to render spinning state
            const res = await new Promise<any[]>((resolve) => {
                setTimeout(() => {
                    resolve(runBatchTest());
                }, 100);
            });
            setResults(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRunning(false);
        }
    };

    const downloadCSV = () => {
        if (!results) return;
        const headers = "Algorithm,Avg Time (ms),Avg Energy (kJ),Avg Dist (m),Success Rate (%),Robustness Score\n";
        const rows = results.map(r => `${r.algorithm},${r.avgTime},${r.avgEnergy},${r.avgDist},${r.successRate},${r.robustnessScore}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uav_batch_test_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="modal-content glass-panel"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        <div className="modal-header">
                            <h3 className="neon-text-blue" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BarChart2 size={24} /> Automated Batch Testing
                            </h3>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-description">
                                Run 20 simulated flights head-to-head across completely random grid layouts using the current Max Battery config ({maxBattery / 1000}k kJ).
                            </p>

                            {!results && !isRunning && (
                                <div className="empty-state">
                                    <Activity size={48} className="text-secondary" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <p>Ready to engage test suite.</p>
                                </div>
                            )}

                            {isRunning && (
                                <div className="loading-state">
                                    <div className="pulse-ring active" style={{ width: 60, height: 60, margin: '0 auto 1rem', position: 'relative' }}></div>
                                    <p className="neon-text-purple pulse-text">Simulating 60 Flights (20 per algorithm)...</p>
                                </div>
                            )}

                            {results && (
                                <div className="results-grid" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr' }}>
                                    <div className="results-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr' }}>
                                        <span>Algorithm</span>
                                        <span>Avg Time</span>
                                        <span>Avg Energy</span>
                                        <span>Avg Dist</span>
                                        <span>Success</span>
                                        <span>Robustness</span>
                                    </div>
                                    {results.map((res: any, idx: number) => (
                                        <motion.div
                                            key={res.algorithm}
                                            className="result-row"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1fr' }}
                                        >
                                            <span className="algo-name">{res.algorithm}</span>
                                            <span>{res.avgTime}</span>
                                            <span className={res.avgEnergy > maxBattery ? 'text-danger' : 'text-success'}>
                                                {res.avgEnergy}
                                            </span>
                                            <span>{res.avgDist}</span>
                                            <span className={res.successRate >= 90 ? 'text-success' : res.successRate < 50 ? 'text-danger' : 'text-warning'}>
                                                {res.successRate}%
                                            </span>
                                            <span className="neon-text-blue">{res.robustnessScore}/100</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                        </div>

                        <div className="modal-footer" style={{ display: 'flex', gap: '1rem' }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="control-btn secondary"
                                onClick={downloadCSV}
                                disabled={!results}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <span>Export CSV</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="control-btn primary"
                                onClick={startTest}
                                disabled={isRunning}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Play size={20} />
                                <span>{isRunning ? 'Processing...' : 'Start Suite'}</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
