import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, FastForward, Volume2, VolumeX, Trash2, Battery, Shuffle, BarChart2, Layers } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { BatchTestingModal } from './BatchTestingModal';
import './SimulationControls.css';

export const SimulationControls = () => {
    const {
        status, runSimulation, pauseSimulation, resetSimulation,
        speed, setSpeed,
        clearObstacles,
        maxBattery, setMaxBattery,
        altitudeCost, setAltitudeCost,
        windDirection, setWindDirection,
        windStrength, setWindStrength,
        autoAlgorithm, setAutoAlgorithm,
        runAllAlgorithms, randomizeMap
    } = useSimulation();

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [density, setDensity] = useState(25);
    const [showBatchModal, setShowBatchModal] = useState(false);

    const isRunning = status === 'RUNNING';
    const isPaused = status === 'PAUSED';

    return (
        <div className="simulation-controls glass-panel">
            <div className="panel-header">
                <h3 className="neon-text-blue">Mission Controls</h3>
                <div className={`status-badge ${isRunning ? 'active' : status === 'FAILED' ? 'failed' : 'idle'}`}>
                    {status}
                </div>
            </div>

            <div className="control-section">
                <div className="section-header">
                    <h4 className="section-label">Playback</h4>
                    <button
                        className="sound-toggle"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-secondary" />}
                    </button>
                </div>
                <div className="button-group">
                    {isRunning ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`control-btn primary active`}
                            onClick={pauseSimulation}
                        >
                            <Pause size={20} />
                            <span>Pause</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`control-btn primary`}
                            onClick={runSimulation}
                            disabled={status === 'COMPUTING' || status === 'REPLANNING' || status === 'FAILED' || status === 'COMPLETED'}
                        >
                            <Play size={20} />
                            <span>{isPaused ? 'Resume' : 'Start'}</span>
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="control-btn secondary"
                        onClick={resetSimulation}
                    >
                        <RotateCcw size={20} />
                        <span>Reset</span>
                    </motion.button>
                </div>
            </div>

            <div className="control-section">
                <div className="section-header">
                    <h4 className="section-label">Simulation Speed</h4>
                    <span className="speed-value text-gradient">{speed}x</span>
                </div>

                <div className="slider-container">
                    <FastForward size={16} className="text-secondary" />
                    <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="custom-slider"
                    />
                </div>
            </div>

            <div className="control-section mt-auto">
                <div className="section-header">
                    <h4 className="section-label">Environment Config</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="sound-toggle" onClick={() => setShowBatchModal(true)} title="Run Batch Tests">
                            <Layers size={16} />
                        </button>
                        <button className="sound-toggle" onClick={runAllAlgorithms} title="Compare Algorithms">
                            <BarChart2 size={16} />
                        </button>
                        <button className="sound-toggle" onClick={randomizeMap} title="Randomize Map">
                            <Shuffle size={16} />
                        </button>
                        <button className="sound-toggle" onClick={clearObstacles} title="Clear Grid">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Battery size={14} /> Max Battery</span>
                        <span className="neon-text-blue">{maxBattery / 1000}k</span>
                    </div>
                    <input
                        type="range"
                        min="10000"
                        max="200000"
                        step="5000"
                        value={maxBattery}
                        onChange={(e) => setMaxBattery(parseInt(e.target.value))}
                        className="custom-slider"
                        style={{ width: '100%' }}
                        disabled={status !== 'IDLE'}
                    />
                </div>

                <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Obstacle Density</span>
                        <span className="neon-text-blue">{density}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={density}
                        onChange={(e) => setDensity(parseInt(e.target.value))}
                        className="custom-slider"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="config-item" onClick={() => setAltitudeCost(!altitudeCost)} style={{ cursor: 'pointer' }}>
                    <span>Altitude Cost</span>
                    <div className={`toggle-switch ${altitudeCost ? 'on' : ''}`} />
                </div>

                <div className="config-item" onClick={() => setAutoAlgorithm(!autoAlgorithm)} style={{ cursor: 'pointer' }}>
                    <span className="neon-text-blue">Auto-Select Algorithm</span>
                    <div className={`toggle-switch ${autoAlgorithm ? 'on' : ''}`} />
                </div>

                <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Wind Strength ({windDirection})</span>
                        <span className="neon-text-purple">{windStrength}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {['N', 'S', 'E', 'W'].map(dir => (
                            <button
                                key={dir}
                                onClick={() => setWindDirection(dir as any)}
                                style={{
                                    flex: 1,
                                    padding: '0.2rem',
                                    borderRadius: '4px',
                                    border: `1px solid ${windDirection === dir ? 'var(--neon-blue)' : 'var(--glass-border)'}`,
                                    background: windDirection === dir ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                    color: windDirection === dir ? 'var(--neon-blue)' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                {dir}
                            </button>
                        ))}
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={windStrength}
                        onChange={(e) => setWindStrength(parseInt(e.target.value))}
                        className="custom-slider"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            <BatchTestingModal
                isOpen={showBatchModal}
                onClose={() => setShowBatchModal(false)}
            />
        </div>
    );
};
