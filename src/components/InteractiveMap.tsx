import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import './InteractiveMap.css';

// Helper to generate random light streaks
const generateStreaks = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 5,
        opacity: 0.1 + Math.random() * 0.3
    }));
};

export const InteractiveMap = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    const {
        obstacles, setObstacles,
        startNode, goalNode,
        activeAlgorithm, setActiveAlgorithm,
        status, currentPathStr,
        dronePos,
        windDirection, windStrength,
        allPaths
    } = useSimulation();

    const [streaks] = useState(generateStreaks(8));
    const [isDrawing, setIsDrawing] = useState(false);

    // Drawing logic
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!e.shiftKey) return;
        setIsDrawing(true);
        e.currentTarget.setPointerCapture(e.pointerId);

        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Size 40x40
            setObstacles(prev => [...prev, [x - 20, y - 20, 40, 40]]);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setObstacles(prev => [...prev, [x - 20, y - 20, 40, 40]]);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDrawing(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Determine active path config based on selected algorithm
    const getActiveColor = () => {
        if (status === 'FAILED') return '#ef4444'; // Red if failed
        switch (activeAlgorithm) {
            case 'A*': return 'var(--neon-blue)';
            case 'HPA*': return '#facc15';
            case 'GA': return 'var(--electric-purple)';
        }
    };

    const activeColor = getActiveColor();

    return (
        <div className="interactive-map-container" ref={containerRef}>
            <div className="zoom-controls">
                <span className="control-hint">Shift+Drag to Draw Obstacles</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="algorithm-selector">
                        {(['A*', 'HPA*', 'GA'] as const).map((algo) => (
                            <button
                                key={algo}
                                className={`algo-btn ${activeAlgorithm === algo ? 'active' : ''}`}
                                onClick={() => setActiveAlgorithm(algo)}
                                disabled={status !== 'IDLE' && status !== 'COMPLETED' && status !== 'FAILED'}
                            >
                                {algo}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <motion.div
                ref={mapRef}
                className="map-content"
                initial={{ scale: 1, x: 0, y: 0 }}
                animate={{ scale: 1 }}
                style={{ transformOrigin: 'center center' }}
                whileTap={{ cursor: isDrawing ? 'crosshair' : 'grabbing' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {/* Animated Background Grids */}
                <div className="map-grid-overlay layer-1" />
                <div className="map-grid-overlay layer-2" />

                {/* Light Streaks FX */}
                {streaks.map(streak => (
                    <motion.div
                        key={streak.id}
                        className="light-streak"
                        style={{ top: streak.top, opacity: streak.opacity }}
                        animate={{ left: ['-10%', '110%'] }}
                        transition={{ duration: streak.duration, delay: streak.delay, repeat: Infinity, ease: "linear" }}
                    />
                ))}

                <svg className="map-svg" width="1600" height="1200" viewBox="0 0 1600 1200">

                    {/* Obstacles with glow */}
                    {obstacles.map((obs, i) => (
                        <rect
                            key={i}
                            x={obs[0]}
                            y={obs[1]}
                            width={obs[2]}
                            height={obs[3]}
                            className="obstacle-rect premium-glow"
                            style={status === 'FAILED' ? { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)' } : undefined}
                        />
                    ))}

                    {/* Active Path or All Paths */}
                    {allPaths ? (
                        allPaths.map((p) => (
                            <path
                                key={p.algo}
                                d={p.pathStr}
                                fill="transparent"
                                stroke={p.color}
                                strokeWidth="4"
                                opacity={status === 'FAILED' ? 0.3 : 0.8}
                            />
                        ))
                    ) : currentPathStr ? (
                        <path
                            d={currentPathStr}
                            fill="transparent"
                            stroke={activeColor}
                            strokeWidth="4"
                            opacity={status === 'FAILED' ? 0.3 : 0.8}
                        />
                    ) : null}

                    {/* Energy Wave on completion */}
                    <motion.circle
                        cx={goalNode.x}
                        cy={goalNode.y}
                        r={10}
                        fill="transparent"
                        stroke={activeColor}
                        strokeWidth={2}
                        animate={{
                            r: status === 'COMPLETED' ? [10, 100] : 10,
                            opacity: status === 'COMPLETED' ? [0.8, 0] : 0
                        }}
                        transition={{
                            duration: 1,
                            ease: "easeOut",
                            repeat: status === 'COMPLETED' ? Infinity : 0,
                            repeatDelay: 1
                        }}
                    />
                </svg>

                {/* Start Point */}
                <div className="node-marker start" style={{ left: startNode.x, top: startNode.y }}>
                    <div className="pulse-ring" style={{ borderColor: activeColor }} />
                    <span>S</span>
                </div>

                {/* Goal Point */}
                <div className="node-marker goal" style={{ left: goalNode.x, top: goalNode.y }}>
                    <div className="pulse-ring" style={{ borderColor: activeColor }} />
                    <span>G</span>
                </div>

                {/* Dynamic Drone Avatar driven directly by dronePos in state. Only show if not comparing all algorithms concurrently */}
                {!allPaths && (
                    <motion.div
                        className="drone-avatar"
                        style={{
                            position: 'absolute',
                            left: dronePos.x,
                            top: dronePos.y,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 100
                        }}
                        animate={{ left: dronePos.x, top: dronePos.y }}
                        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
                    >
                        {/* Drone Glow FX */}
                        <motion.div
                            className="drone-aura"
                            animate={{
                                backgroundColor: activeColor,
                                boxShadow: status === 'FAILED' ? `0 0 50px 20px ${activeColor}` : `0 0 30px 10px ${activeColor}`
                            }}
                            transition={{ duration: 0.2 }}
                        />
                        <Navigation className="drone-nav-icon" size={24} style={{ fill: activeColor, color: activeColor }} />

                        {status === 'FAILED' && (
                            <div style={{ position: 'absolute', top: -30, whiteSpace: 'nowrap', color: '#ef4444', fontWeight: 'bold', background: 'rgba(20,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ef4444' }}>
                                MISSION FAILED: BATTERY
                            </div>
                        )}
                        {status === 'REPLANNING' && (
                            <div style={{ position: 'absolute', top: -30, whiteSpace: 'nowrap', color: '#facc15', fontWeight: 'bold', background: 'rgba(20,20,0,0.8)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #facc15' }}>
                                REPLANNING...
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Wind Indicator */}
                {windStrength > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        backdropFilter: 'blur(4px)',
                        color: 'var(--neon-blue)',
                        zIndex: 10
                    }}>
                        <Navigation
                            size={20}
                            style={{
                                transform: `rotate(${windDirection === 'N' ? 0 : windDirection === 'E' ? 90 : windDirection === 'S' ? 180 : 270}deg)`,
                                transition: 'transform 0.3s ease'
                            }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Wind: {windStrength}</span>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
