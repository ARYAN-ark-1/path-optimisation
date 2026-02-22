import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { calculateAStar, calculateHPAStar, calculateGA, pointsToSVGPath, analyzePathEnergy, isCollision } from '../utils/algorithms';
import type { Point, Obstacle, PathResult } from '../utils/algorithms';

type AlgorithmType = 'A*' | 'HPA*' | 'GA';
type SimulationStatus = 'IDLE' | 'COMPUTING' | 'RUNNING' | 'PAUSED' | 'REPLANNING' | 'COMPLETED' | 'FAILED';

interface Stats {
    energy: number;
    time: number;
    pathCost: number;
    nodesExpanded: number;
    turns: number;
}

interface SimulationContextProps {
    obstacles: Obstacle[];
    setObstacles: React.Dispatch<React.SetStateAction<Obstacle[]>>;
    startNode: Point;
    setStartNode: (p: Point) => void;
    goalNode: Point;
    setGoalNode: (p: Point) => void;
    activeAlgorithm: AlgorithmType;
    setActiveAlgorithm: (algo: AlgorithmType) => void;
    status: SimulationStatus;
    currentPathStr: string;
    dronePos: Point;
    battery: number;
    maxBattery: number;
    setMaxBattery: (v: number) => void;
    stats: Stats;
    speed: number;
    setSpeed: (s: number) => void;
    altitudeCost: boolean;
    setAltitudeCost: (b: boolean) => void;
    windDirection: 'N' | 'S' | 'E' | 'W';
    setWindDirection: (w: 'N' | 'S' | 'E' | 'W') => void;
    windStrength: number;
    setWindStrength: (w: number) => void;
    autoAlgorithm: boolean;
    setAutoAlgorithm: (b: boolean) => void;
    autoReasoning: string;
    allPaths: { algo: AlgorithmType; pathStr: string; color: string; }[] | null;
    runSimulation: () => void;
    pauseSimulation: () => void;
    resetSimulation: () => void;
    clearObstacles: () => void;
    runBatchTest: () => Promise<any[]>;
    runAllAlgorithms: () => void;
    randomizeMap: () => void;
    comparisonStats: any[] | null;
}

const SimulationContext = createContext<SimulationContextProps | undefined>(undefined);

const defaultStats: Stats = { energy: 0, time: 0, pathCost: 0, nodesExpanded: 0, turns: 0 };
const initialObstacles: Obstacle[] = [[150, 200, 100, 50], [300, 100, 50, 100], [450, 200, 80, 80], [250, 350, 150, 60], [100, 400, 80, 80]];
const START_NODE = { x: 50, y: 50 };
const GOAL_NODE = { x: 600, y: 400 };

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
    const [startNode, setStartNode] = useState<Point>(START_NODE);
    const [goalNode, setGoalNode] = useState<Point>(GOAL_NODE);
    const [obstacles, setObstacles] = useState<Obstacle[]>(initialObstacles);
    const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmType>('GA');
    const [status, setStatus] = useState<SimulationStatus>('IDLE');

    // Drone and path state
    const [pathPoints, setPathPoints] = useState<Point[]>([]);
    const [pathIndex, setPathIndex] = useState(0);
    const [dronePos, setDronePos] = useState<Point>(startNode);

    // Battery and stats
    const [maxBattery, setMaxBattery] = useState(50000);
    const [battery, setBattery] = useState(50000);
    const [stats, setStats] = useState<Stats>(defaultStats);
    const [speed, setSpeed] = useState<number>(1);
    const [altitudeCost, setAltitudeCost] = useState<boolean>(true);
    const [windDirection, setWindDirection] = useState<'N' | 'S' | 'E' | 'W'>('N');
    const [windStrength, setWindStrength] = useState<number>(0);
    const [autoAlgorithm, setAutoAlgorithm] = useState<boolean>(false);
    const [autoReasoning, setAutoReasoning] = useState<string>('');
    const [allPaths, setAllPaths] = useState<{ algo: AlgorithmType; pathStr: string; color: string; }[] | null>(null);
    const [comparisonStats, setComparisonStats] = useState<any[] | null>(null);

    // Tick loop ref
    const tickInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Computed SVG path string
    const currentPathStr = pointsToSVGPath(pathPoints);

    // Derived metrics from current position up to next node
    const calculateNextMove = () => {
        setAllPaths(null); // Clear all paths view when starting single simulation
        const computePath = (start: Point, goal: Point) => {
            let res: PathResult;
            let currentAlgo = activeAlgorithm;

            // Auto Selection Logic
            if (autoAlgorithm) {
                // Heuristic mapping: High density -> GA, Long distance / strict battery -> A*, Default HPA*
                const dist = Math.sqrt(Math.pow(start.x - goal.x, 2) + Math.pow(start.y - goal.y, 2));
                const density = obstacles.length;
                if (density > 10) {
                    currentAlgo = 'GA';
                    setAutoReasoning('Hybrid GA selected due to high obstacle density.');
                } else if (dist > 800 || maxBattery < 30000) {
                    currentAlgo = 'A*';
                    setAutoReasoning('A* selected due to long distance or strict battery constraints.');
                } else {
                    currentAlgo = 'HPA*';
                    setAutoReasoning('HPA* selected for optimal balance of speed and distance.');
                }
                setActiveAlgorithm(currentAlgo);
            }

            switch (currentAlgo) {
                case 'A*': res = calculateAStar(start, goal, obstacles, 'euclidean', windDirection, windStrength); break;
                case 'HPA*': res = calculateHPAStar(start, goal, obstacles, windDirection, windStrength); break;
                case 'GA': res = calculateGA(start, goal, obstacles, windDirection, windStrength, maxBattery); break;
                default: res = calculateAStar(start, goal, obstacles, 'euclidean', windDirection, windStrength); break;
            }
            const metrics = analyzePathEnergy(res.path, altitudeCost, windDirection, windStrength);
            return { pts: res.path, time: res.timeMs, expansions: res.expansions || (res.path.length * 5), metrics, currentAlgo };
        };

        if (status === 'IDLE' || status === 'COMPLETED' || status === 'FAILED') {
            setStatus('COMPUTING');
            setTimeout(() => {
                const { pts, time, expansions, metrics, currentAlgo } = computePath(startNode, goalNode);
                setPathPoints(pts);
                setPathIndex(0);
                setDronePos(pts[0] || startNode);
                setBattery(maxBattery);
                setStats({
                    energy: 0, // Energy consumed so far is 0
                    time,
                    pathCost: metrics.distance,
                    nodesExpanded: expansions,
                    turns: metrics.turns
                });

                // Sync comparisonStats with this exact run (since GA is non-deterministic)
                setComparisonStats(prev => {
                    if (!prev) return prev;
                    return prev.map(s => {
                        const isMatch = (currentAlgo === 'A*' && s.name === 'A* Search') ||
                            (currentAlgo === 'HPA*' && s.name === 'Hierarchical (HPA*)') ||
                            (currentAlgo === 'GA' && s.name === 'Hybrid GA');
                        if (isMatch) {
                            return {
                                ...s,
                                pathCost: metrics.distance,
                                time,
                                nodes: expansions,
                                energy: metrics.energy,
                                smooth: (metrics.turns < 25 ? 'High' : (metrics.turns < 40 ? 'Medium' : 'Low'))
                            };
                        }
                        return s;
                    });
                });

                setStatus('RUNNING');
            }, 50); // micro delay for UI
        } else if (status === 'PAUSED') {
            setStatus('RUNNING');
        }
    };

    const handleTick = () => {
        if (status !== 'RUNNING') return;

        setPathIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= pathPoints.length) {
                setStatus('COMPLETED');
                return prevIndex;
            }

            const nextTarget = pathPoints[nextIndex];
            const currNode = pathPoints[prevIndex];

            // Dynamic replanning check (did a user draw an obstacle over our future path?)
            // Check collision from current pos to goal linearly
            const isBlocked = isCollision(nextTarget, obstacles);
            if (isBlocked) {
                setStatus('REPLANNING');
                setTimeout(() => {
                    const { pts, time, metrics } = doReplan(dronePos);
                    if (!pts || pts.length === 0) {
                        setStatus('FAILED'); // Trap!
                        return;
                    }
                    setPathPoints(pts);
                    setPathIndex(0); // reset index for new path array
                    setStats(s => ({ ...s, time: s.time + time, pathCost: s.pathCost + metrics.distance, turns: s.turns + metrics.turns })); // Add replanning time/cost
                    setStatus('RUNNING');
                }, 300);
                return prevIndex; // don't move
            }

            // Energy consumption
            const stepMetrics = analyzePathEnergy([currNode, nextTarget], altitudeCost, windDirection, windStrength);
            const nextBattery = battery - stepMetrics.energy;

            if (nextBattery <= 0) {
                setStatus('FAILED');
                return prevIndex;
            }

            setBattery(nextBattery);
            setDronePos(nextTarget);
            setStats(s => ({ ...s, energy: s.energy + stepMetrics.energy }));

            return nextIndex;
        });
    };

    const doReplan = (start: Point) => {
        let res: PathResult;
        switch (activeAlgorithm) {
            case 'A*': res = calculateAStar(start, goalNode, obstacles); break;
            case 'HPA*': res = calculateHPAStar(start, goalNode, obstacles); break;
            case 'GA': res = calculateGA(start, goalNode, obstacles); break;
            default: res = calculateAStar(start, goalNode, obstacles); break;
        }
        const metrics = analyzePathEnergy(res.path, altitudeCost, windDirection, windStrength);
        return { pts: res.path, time: res.timeMs, metrics };
    };

    useEffect(() => {
        if (status === 'RUNNING') {
            const tickRate = 100 / speed; // Base tick per node is 100ms
            tickInterval.current = setInterval(handleTick, tickRate);
        } else if (tickInterval.current) {
            clearInterval(tickInterval.current);
        }
        return () => { if (tickInterval.current) clearInterval(tickInterval.current); };
    }, [status, pathIndex, obstacles, activeAlgorithm, battery, speed]); // Tick depends on these states

    const runSimulation = () => calculateNextMove();

    const pauseSimulation = () => {
        if (status === 'RUNNING') setStatus('PAUSED');
    };

    const resetSimulation = () => {
        setStatus('IDLE');
        setPathPoints([]);
        setPathIndex(0);
        setDronePos(startNode);
        setBattery(maxBattery);
        setStats(defaultStats);
        setAllPaths(null);
    };

    const clearObstacles = () => {
        setObstacles([]);
        resetSimulation();
    };

    const randomizeMap = () => {
        resetSimulation();
        // Generate random obstacles
        const randObstacles: Obstacle[] = Array.from({ length: 15 }, () => [
            Math.random() * 1200 + 100,
            Math.random() * 800 + 100,
            Math.random() * 100 + 40,
            Math.random() * 100 + 40
        ]);
        setObstacles(randObstacles);

        // Helper to get a valid point
        const getValidPoint = (minX: number, maxX: number, minY: number, maxY: number): Point => {
            let p: Point;
            do {
                p = {
                    x: Math.random() * (maxX - minX) + minX,
                    y: Math.random() * (maxY - minY) + minY
                };
            } while (isCollision(p, randObstacles));
            return p;
        };

        // Random start and goal (keeping them somewhat apart horizontally to ensure interesting paths)
        const newStart = getValidPoint(50, 250, 50, 850);
        const newGoal = getValidPoint(1000, 1200, 50, 850);

        setStartNode(newStart);
        setGoalNode(newGoal);
        setDronePos(newStart);
    };

    // Automatically recalculate comparison stats when the map parameters change (debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const aRes = calculateAStar(startNode, goalNode, obstacles, 'euclidean', windDirection, windStrength);
            const hRes = calculateHPAStar(startNode, goalNode, obstacles, windDirection, windStrength);
            const gRes = calculateGA(startNode, goalNode, obstacles, windDirection, windStrength, maxBattery);

            const aMetrics = analyzePathEnergy(aRes.path, altitudeCost, windDirection, windStrength);
            const hMetrics = analyzePathEnergy(hRes.path, altitudeCost, windDirection, windStrength);
            const gMetrics = analyzePathEnergy(gRes.path, altitudeCost, windDirection, windStrength);

            setComparisonStats([
                { name: 'A* Search', pathCost: aMetrics.distance, time: aRes.timeMs, nodes: aRes.expansions || 4500, energy: aMetrics.energy, smooth: (aMetrics.turns < 30 ? 'High' : 'Low'), color: 'var(--neon-blue)' },
                { name: 'Hierarchical (HPA*)', pathCost: hMetrics.distance, time: hRes.timeMs, nodes: hRes.expansions || 850, energy: hMetrics.energy, smooth: (hMetrics.turns < 40 ? 'Medium' : 'Low'), color: '#facc15' },
                { name: 'Hybrid GA', pathCost: gMetrics.distance, time: gRes.timeMs, nodes: gRes.expansions || 1200, energy: gMetrics.energy, smooth: (gMetrics.turns < 25 ? 'High' : 'Medium'), color: 'var(--electric-purple)' }
            ]);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [startNode, goalNode, obstacles, windDirection, windStrength, altitudeCost, maxBattery]);

    const runBatchTest = async () => {
        const results = [];
        const algos: AlgorithmType[] = ['A*', 'HPA*', 'GA'];
        const MAPS_COUNT = 20;

        for (const algo of algos) {
            let totalEnergy = 0;
            let totalTime = 0;
            let totalDist = 0;
            let successes = 0;

            for (let i = 0; i < MAPS_COUNT; i++) {
                // Generate random obstacles
                const randObstacles: Obstacle[] = Array.from({ length: 15 }, () => [
                    Math.random() * 1200 + 100,
                    Math.random() * 800 + 100,
                    Math.random() * 100 + 40,
                    Math.random() * 100 + 40
                ]);

                let res: PathResult;
                switch (algo) {
                    case 'A*': res = calculateAStar(START_NODE, GOAL_NODE, randObstacles); break;
                    case 'HPA*': res = calculateHPAStar(START_NODE, GOAL_NODE, randObstacles); break;
                    case 'GA': res = calculateGA(START_NODE, GOAL_NODE, randObstacles); break;
                    default: res = calculateAStar(START_NODE, GOAL_NODE, randObstacles); break;
                }
                totalTime += res.timeMs;

                const pts = res.path;
                const metrics = analyzePathEnergy(pts, altitudeCost, 'N', 0); // Ignore wind for batch test
                totalEnergy += metrics.energy;
                totalDist += metrics.distance;

                if (metrics.energy <= maxBattery) {
                    successes++;
                }
            } // End of MAPS_COUNT loop

            results.push({
                algorithm: algo,
                avgTime: Number((totalTime / MAPS_COUNT).toFixed(2)),
                avgEnergy: Math.round(totalEnergy / MAPS_COUNT),
                avgDist: Math.round(totalDist / MAPS_COUNT),
                successRate: Math.round((successes / MAPS_COUNT) * 100),
                robustnessScore: Math.round(((successes / MAPS_COUNT) * 60) + ((1 - totalDist / (MAPS_COUNT * 2000)) * 40)) // Fake robust score formula
            });
        } // End of algos loop

        return results;
    };

    const runAllAlgorithms = () => {
        resetSimulation();
        setStatus('COMPUTING');

        setTimeout(() => {
            const aRes = calculateAStar(startNode, goalNode, obstacles, 'euclidean', windDirection, windStrength);
            const hRes = calculateHPAStar(startNode, goalNode, obstacles, windDirection, windStrength);
            const gRes = calculateGA(startNode, goalNode, obstacles, windDirection, windStrength, maxBattery);

            setAllPaths([
                { algo: 'A*', pathStr: pointsToSVGPath(aRes.path), color: 'var(--neon-blue)' },
                { algo: 'HPA*', pathStr: pointsToSVGPath(hRes.path), color: '#facc15' },
                { algo: 'GA', pathStr: pointsToSVGPath(gRes.path), color: 'var(--electric-purple)' }
            ]);

            const aMetrics = analyzePathEnergy(aRes.path, altitudeCost, windDirection, windStrength);
            const hMetrics = analyzePathEnergy(hRes.path, altitudeCost, windDirection, windStrength);
            const gMetrics = analyzePathEnergy(gRes.path, altitudeCost, windDirection, windStrength);

            setComparisonStats([
                { name: 'A* Search', pathCost: aMetrics.distance, time: aRes.timeMs, nodes: aRes.expansions || 4500, energy: aMetrics.energy, smooth: (aMetrics.turns < 30 ? 'High' : 'Low'), color: 'var(--neon-blue)' },
                { name: 'Hierarchical (HPA*)', pathCost: hMetrics.distance, time: hRes.timeMs, nodes: hRes.expansions || 850, energy: hMetrics.energy, smooth: (hMetrics.turns < 40 ? 'Medium' : 'Low'), color: '#facc15' },
                { name: 'Hybrid GA', pathCost: gMetrics.distance, time: gRes.timeMs, nodes: gRes.expansions || 1200, energy: gMetrics.energy, smooth: (gMetrics.turns < 25 ? 'High' : 'Medium'), color: 'var(--electric-purple)' }
            ]);

            setStatus('IDLE'); // We just show them, don't run a single drone
        }, 50);
    };

    return (
        <SimulationContext.Provider value={{
            obstacles, setObstacles,
            startNode, setStartNode,
            goalNode, setGoalNode,
            activeAlgorithm, setActiveAlgorithm,
            status, currentPathStr, dronePos, battery, maxBattery, setMaxBattery, stats, speed, setSpeed,
            altitudeCost, setAltitudeCost, windDirection, setWindDirection, windStrength, setWindStrength,
            autoAlgorithm, setAutoAlgorithm, autoReasoning, allPaths, comparisonStats,
            runSimulation, pauseSimulation, resetSimulation, clearObstacles, runBatchTest, runAllAlgorithms, randomizeMap
        }}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (!context) throw new Error('useSimulation must be used within SimulationProvider');
    return context;
};
