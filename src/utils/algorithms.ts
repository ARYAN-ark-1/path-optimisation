export type Point = { x: number; y: number; z?: number };
export type Obstacle = [number, number, number, number]; // x, y, width, height

export const GRID_WIDTH = 1600;
export const GRID_HEIGHT = 1200;
export const CELL_SIZE = 20;

export const ENERGY_COST_PER_MOVE = 5;
export const ENERGY_PENALTY_TURN = 2;
export const ALTITUDE_COST_PER_UNIT = 10;

export const getWindMultiplier = (p1: Point, p2: Point, windDirection: 'N' | 'S' | 'E' | 'W', windStrength: number): number => {
    if (windStrength === 0) return 1;
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return 1;
    dx /= len;
    dy /= len;

    let wx = 0, wy = 0;
    if (windDirection === 'E') wx = 1;
    else if (windDirection === 'W') wx = -1;
    else if (windDirection === 'S') wy = 1;
    else if (windDirection === 'N') wy = -1;

    const dot = dx * wx + dy * wy;
    // Moving with wind (dot > 0) reduces cost, against wind (dot < 0) increases cost
    return Math.max(0.1, 1 - dot * windStrength * 0.05);
};

export interface PathResult {
    path: Point[];
    timeMs: number;
    expansions?: number;
    generations?: number;
    fitnessProgression?: number[];
    reducedExpansions?: number;
}

// Helper to check collision with any obstacle (treating obstacles as impassable rectangles)
export const isCollision = (p: Point, obstacles: Obstacle[]): boolean => {
    for (const obs of obstacles) {
        // Adding minor padding
        if (p.x >= obs[0] && p.x <= obs[0] + obs[2] &&
            p.y >= obs[1] && p.y <= obs[1] + obs[3]) {
            return true;
        }
    }
    return false;
};

// Euclidean distance
export const heuristicEuclidean = (a: Point, b: Point) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

// Manahattan distance (faster for grid)
export const heuristicManhattan = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// DEFAULT HEURISTIC IF NOT SPECIFIED
export const heuristic = heuristicEuclidean;

// --- PRIORITY QUEUE ---
class PriorityQueue<T> {
    private items: { element: T; priority: number }[] = [];

    enqueue(element: T, priority: number) {
        const qElement = { element, priority };
        let contain = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                this.items.splice(i, 0, qElement);
                contain = true;
                break;
            }
        }
        if (!contain) this.items.push(qElement);
    }

    dequeue(): T | undefined { return this.items.shift()?.element; }
    isEmpty(): boolean { return this.items.length === 0; }
}

// --- ACTUAL A* ALGORITHM ---
export const calculateAStar = (
    start: Point,
    goal: Point,
    obstacles: Obstacle[],
    heuristicType: 'manhattan' | 'euclidean' = 'euclidean',
    windDirection: 'N' | 'S' | 'E' | 'W' = 'N',
    windStrength: number = 0,
    maxIter: number = 5000
): PathResult => {
    const startT = performance.now();
    const step = CELL_SIZE;
    const snapToGrid = (p: Point) => ({ x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step });

    const sNode = snapToGrid(start);
    const gNode = snapToGrid(goal);

    const hFunc = heuristicType === 'manhattan' ? heuristicManhattan : heuristicEuclidean;

    const pq = new PriorityQueue<Point>();
    const openSet = new Set<string>();
    const closedSet = new Set<string>();

    pq.enqueue(sNode, 0);
    openSet.add(`${sNode.x},${sNode.y}`);

    const cameFrom = new Map<string, Point>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(`${sNode.x},${sNode.y}`, 0);
    fScore.set(`${sNode.x},${sNode.y}`, hFunc(sNode, gNode));

    const dirs = [
        { x: 0, y: -step }, { x: step, y: 0 }, { x: 0, y: step }, { x: -step, y: 0 },
        { x: step, y: -step }, { x: step, y: step }, { x: -step, y: step }, { x: -step, y: -step }
    ];

    let iter = 0;
    let closestNode = sNode;
    let minH = hFunc(sNode, gNode);
    let expansions = 0;

    while (!pq.isEmpty() && iter < maxIter) {
        iter++;
        const current = pq.dequeue()!;
        const currKey = `${current.x},${current.y}`;

        openSet.delete(currKey);
        closedSet.add(currKey);
        expansions++;

        const distToGoal = hFunc(current, gNode);
        if (distToGoal < minH) {
            minH = distToGoal;
            closestNode = current;
        }

        if (distToGoal <= step * 1.5) {
            closestNode = current;
            break;
        }

        for (const d of dirs) {
            const neighbor = { x: current.x + d.x, y: current.y + d.y };
            const nKey = `${neighbor.x},${neighbor.y}`;

            if (neighbor.x < 0 || neighbor.x >= GRID_WIDTH || neighbor.y < 0 || neighbor.y >= GRID_HEIGHT) continue;
            if (isCollision(neighbor, obstacles)) continue;
            if (closedSet.has(nKey)) continue;

            const windMult = getWindMultiplier(current, neighbor, windDirection, windStrength);
            const moveCost = hFunc(current, neighbor) * windMult;
            const tentativeG = gScore.get(currKey)! + moveCost;

            if (!openSet.has(nKey) || tentativeG < (gScore.get(nKey) || Infinity)) {
                cameFrom.set(nKey, current);
                gScore.set(nKey, tentativeG);
                const currentF = tentativeG + hFunc(neighbor, gNode);
                fScore.set(nKey, currentF);

                if (!openSet.has(nKey)) {
                    pq.enqueue(neighbor, currentF);
                    openSet.add(nKey);
                }
            }
        }
    }

    // Reconstruct path
    const path: Point[] = [goal];
    let currStr = `${closestNode.x},${closestNode.y}`;
    while (cameFrom.has(currStr)) {
        const parent = cameFrom.get(currStr)!;
        path.unshift({ x: parent.x, y: parent.y });
        currStr = `${parent.x},${parent.y}`;
    }
    if (path[0].x !== start.x || path[0].y !== start.y) path.unshift(start);

    return {
        path,
        timeMs: Number((performance.now() - startT).toFixed(2)),
        expansions
    };
};

// --- HIERARCHICAL A* (HPA*) ALGORITHM ---
/* 
  True hierarchical logic divides the grid into large clusters.
  We abstract this by using a sparse graph: A macro A* over 80px chunks,
  followed by interpolating the micro points.
*/
export const calculateHPAStar = (start: Point, goal: Point, obstacles: Obstacle[], windDirection: 'N' | 'S' | 'E' | 'W' = 'N', windStrength: number = 0): PathResult => {
    const startT = performance.now();
    const MACRO_STEP = 100;

    // Abstract grid into Regions
    const snapToMacro = (p: Point) => ({ x: Math.round(p.x / MACRO_STEP) * MACRO_STEP, y: Math.round(p.y / MACRO_STEP) * MACRO_STEP });
    const sNode = snapToMacro(start);
    const gNode = snapToMacro(goal);

    const pq = new PriorityQueue<Point>();
    pq.enqueue(sNode, 0);

    const cameFrom = new Map<string, Point>();
    const gScore = new Map<string, number>();
    gScore.set(`${sNode.x},${sNode.y}`, 0);

    const dirs = [{ x: 0, y: -MACRO_STEP }, { x: MACRO_STEP, y: 0 }, { x: 0, y: MACRO_STEP }, { x: -MACRO_STEP, y: 0 }];

    let closestNode = sNode;
    let minH = heuristicEuclidean(sNode, gNode);
    let iter = 0;
    let highLevelExpansions = 0;
    let lowLevelExpansions = 0;

    // High level search on abstract region centers (Gateways)
    while (!pq.isEmpty() && iter < 1000) {
        iter++;
        highLevelExpansions++;
        const current = pq.dequeue()!;
        const currKey = `${current.x},${current.y}`;

        const distToGoal = heuristicEuclidean(current, gNode);
        if (distToGoal < minH) {
            minH = distToGoal;
            closestNode = current;
        }

        if (distToGoal <= MACRO_STEP * 1.5) { closestNode = current; break; }

        for (const d of dirs) {
            const n = { x: current.x + d.x, y: current.y + d.y };
            if (n.x < 0 || n.x >= GRID_WIDTH || n.y < 0 || n.y >= GRID_HEIGHT) continue;

            // Region blockage check (simulate regional gateways)
            if (isCollision(n, obstacles) || isCollision({ x: n.x + MACRO_STEP / 2, y: n.y + MACRO_STEP / 2 }, obstacles)) continue;

            const nKey = `${n.x},${n.y}`;
            const windMult = getWindMultiplier(current, n, windDirection, windStrength);
            const tentativeG = gScore.get(currKey)! + MACRO_STEP * windMult;

            if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)!) {
                cameFrom.set(nKey, current);
                gScore.set(nKey, tentativeG);
                pq.enqueue(n, tentativeG + heuristicEuclidean(n, gNode) * windMult);
            }
        }
    }

    const macroPath: Point[] = [];
    let currStr = `${closestNode.x},${closestNode.y}`;
    while (cameFrom.has(currStr)) {
        const parent = cameFrom.get(currStr)!;
        macroPath.unshift(parent);
        currStr = `${parent.x},${parent.y}`;
    }
    macroPath.push(goal);

    // Refine locally
    const fullPath: Point[] = [start];
    for (let i = 0; i < macroPath.length; i++) {
        const target = macroPath[i];
        const last = fullPath[fullPath.length - 1];
        if (heuristicEuclidean(target, last) > CELL_SIZE) {
            let curr = { ...last };
            while (heuristicEuclidean(curr, target) > CELL_SIZE) {
                lowLevelExpansions++;
                const dx = target.x - curr.x;
                const dy = target.y - curr.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nextP = { x: curr.x + (dx / len) * CELL_SIZE, y: curr.y + (dy / len) * CELL_SIZE };
                if (!isCollision(nextP, obstacles)) {
                    curr = nextP;
                    fullPath.push({ x: curr.x, y: curr.y });
                } else {
                    break;
                }
            }
        }
        fullPath.push(target);
    }

    return {
        path: fullPath,
        timeMs: Number((performance.now() - startT).toFixed(2)),
        expansions: highLevelExpansions + lowLevelExpansions,
        reducedExpansions: lowLevelExpansions
    };
};


// --- GENETIC ALGORITHM (True Metaheuristic) ---
/*
  True GA creates a population of random paths, evaluates fitness based on collisions and distance,
  crosses them over, mutates them, and yields the best.
*/
export const calculateGA = (
    start: Point, goal: Point, obstacles: Obstacle[],
    windDirection: 'N' | 'S' | 'E' | 'W' = 'N', windStrength: number = 0,
    maxBattery: number = 50000
): PathResult => {
    const startT = performance.now();
    const POPULATION_SIZE = 60;
    const MAX_GENERATIONS = 120;
    const STAGNATION_LIMIT = 20;

    // --- Helper Options ---
    const removeLoops = (path: Point[]): Point[] => {
        const cleaned = [...path];
        let i = 0;
        while (i < cleaned.length) {
            let loopEnd = -1;
            for (let j = cleaned.length - 1; j > i + 3; j--) {
                if (heuristicEuclidean(cleaned[i], cleaned[j]) < CELL_SIZE * 1.5) {
                    loopEnd = j;
                    break;
                }
            }
            if (loopEnd !== -1) {
                cleaned.splice(i + 1, loopEnd - i);
            }
            i++;
        }
        return cleaned;
    };

    const interpolateAndRepair = (waypoints: Point[]): Point[] => {
        const path: Point[] = [waypoints[0]];
        for (let i = 0; i < waypoints.length - 1; i++) {
            let curr = waypoints[i];
            const target = waypoints[i + 1];
            let segment: Point[] = [];
            let hitObstacle = false;
            let iters = 0;
            let tempCurr = { ...curr };

            while (heuristicEuclidean(tempCurr, target) > CELL_SIZE && iters < 200) {
                iters++;
                const dx = target.x - tempCurr.x;
                const dy = target.y - tempCurr.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nextP = {
                    x: Math.max(0, Math.min(GRID_WIDTH, tempCurr.x + (dx / len) * CELL_SIZE)),
                    y: Math.max(0, Math.min(GRID_HEIGHT, tempCurr.y + (dy / len) * CELL_SIZE))
                };

                if (!isCollision(nextP, obstacles)) {
                    tempCurr = nextP;
                    segment.push(tempCurr);
                } else {
                    hitObstacle = true;
                    break;
                }
            }

            if (hitObstacle) {
                // local A* repair (limit to 500 iters to be fast)
                const repaired = calculateAStar(curr, target, obstacles, 'euclidean', windDirection, windStrength, 500).path;
                if (repaired.length > 0) {
                    if (heuristicEuclidean(repaired[0], curr) < CELL_SIZE) repaired.shift();
                    path.push(...repaired);
                } else {
                    path.push(...segment);
                }
            } else {
                path.push(...segment);
            }
            path.push(target);
        }
        return removeLoops(path);
    };

    const mutateSegment = (path: Point[]): Point[] => {
        const mutPath = [...path];
        if (mutPath.length > 10) {
            const idx1 = 1 + Math.floor(Math.random() * (mutPath.length - 5));
            const idx2 = Math.min(mutPath.length - 2, idx1 + 2 + Math.floor(Math.random() * 20)); // replace a chunk of up to 20 nodes

            // Create a random intermediate waypoint
            const midX = (mutPath[idx1].x + mutPath[idx2].x) / 2 + (Math.random() * 200 - 100);
            const midY = (mutPath[idx1].y + mutPath[idx2].y) / 2 + (Math.random() * 200 - 100);
            const midP = {
                x: Math.max(0, Math.min(GRID_WIDTH, midX)),
                y: Math.max(0, Math.min(GRID_HEIGHT, midY))
            };

            const repairedSegment = interpolateAndRepair([mutPath[idx1], midP, mutPath[idx2]]);
            // Replace segment
            mutPath.splice(idx1 + 1, idx2 - idx1 - 1, ...repairedSegment.slice(1, -1));
        }
        return removeLoops(mutPath);
    };

    // 1. Initial A* Path
    const aStarRes = calculateAStar(start, goal, obstacles, 'euclidean', windDirection, windStrength);
    const exactAStar = aStarRes.path;

    let population: Point[][] = [];

    // 30% Exact A* (18 paths)
    for (let i = 0; i < 18; i++) population.push([...exactAStar]);

    // 30% Mutated A* (18 paths)
    for (let i = 0; i < 18; i++) {
        population.push(mutateSegment(exactAStar));
    }

    // 40% Random Feasible (24 paths)
    for (let i = 0; i < 24; i++) {
        const waypoints = [start];
        const numMid = 3 + Math.floor(Math.random() * 3);
        for (let j = 1; j <= numMid; j++) {
            waypoints.push({
                x: Math.max(0, Math.min(GRID_WIDTH, start.x + (goal.x - start.x) * (j / (numMid + 1)) + (Math.random() * 600 - 300))),
                y: Math.max(0, Math.min(GRID_HEIGHT, start.y + (goal.y - start.y) * (j / (numMid + 1)) + (Math.random() * 600 - 300)))
            });
        }
        waypoints.push(goal);
        population.push(interpolateAndRepair(waypoints));
    }

    interface Ind { path: Point[]; f: number; }

    const evalPopulation = (pop: Point[][]): Ind[] => {
        const metrics = pop.map(p => {
            const m = analyzePathEnergy(p, true, windDirection, windStrength);
            return { p, d: m.distance, e: m.energy, t: m.turns, pb: m.energy > maxBattery ? 10 : 0 };
        });

        const dMax = Math.max(...metrics.map(m => m.d), 1);
        const eMax = Math.max(...metrics.map(m => m.e), 1);
        const tMax = Math.max(...metrics.map(m => m.t), 1);

        return metrics.map(m => {
            const f = 0.35 * (m.d / dMax) + 0.35 * (m.e / eMax) + 0.15 * (m.t / tMax) + 0.15 * m.pb;
            return { path: m.p, f };
        }).sort((a, b) => a.f - b.f);
    };

    let evaluatedPop = evalPopulation(population);
    let bestFitness = evaluatedPop[0].f;
    let fitnessProgression: number[] = [bestFitness];
    let noImprovementCount = 0;
    let mutationRate = 0.08;
    let generationsRequired = 0;

    const tournamentSelection = (inds: Ind[]): Ind => {
        let best = inds[Math.floor(Math.random() * inds.length)];
        for (let i = 1; i < 3; i++) {
            const candidate = inds[Math.floor(Math.random() * inds.length)];
            if (candidate.f < best.f) best = candidate;
        }
        return best;
    };

    const crossover = (p1: Point[], p2: Point[]): Point[] => {
        const commonPairs: [number, number][] = [];
        for (let i = 2; i < p1.length - 2; i += 4) {
            for (let j = 2; j < p2.length - 2; j += 4) {
                if (heuristicEuclidean(p1[i], p2[j]) < CELL_SIZE * 2) {
                    commonPairs.push([i, j]);
                }
            }
        }
        if (commonPairs.length > 0) {
            const pair = commonPairs[Math.floor(Math.random() * commonPairs.length)];
            return removeLoops([...p1.slice(0, pair[0]), ...p2.slice(pair[1])]);
        }
        return Math.random() < 0.5 ? [...p1] : [...p2];
    };

    const mutate = (path: Point[], mutRate: number): Point[] => {
        if (Math.random() < mutRate) {
            return mutateSegment(path);
        }
        return path;
    };

    for (let gen = 0; gen < MAX_GENERATIONS; gen++) {
        generationsRequired++;

        // 5% elitism (3 individuals)
        const nextGen: Point[][] = [
            evaluatedPop[0].path,
            evaluatedPop[1].path,
            evaluatedPop[2].path
        ];

        while (nextGen.length < POPULATION_SIZE) {
            const parent1 = tournamentSelection(evaluatedPop).path;
            const parent2 = tournamentSelection(evaluatedPop).path;
            let child = crossover(parent1, parent2);
            child = mutate(child, mutationRate);
            nextGen.push(child);
        }

        evaluatedPop = evalPopulation(nextGen);
        const currentBestFit = evaluatedPop[0].f;
        fitnessProgression.push(currentBestFit);

        if (Math.abs(bestFitness - currentBestFit) < 0.001) {
            noImprovementCount++;
        } else {
            bestFitness = currentBestFit;
            noImprovementCount = 0;
        }

        if (noImprovementCount >= 10) mutationRate = 0.15;
        if (noImprovementCount >= STAGNATION_LIMIT) break;
    }

    return {
        path: evaluatedPop[0].path,
        timeMs: Number((performance.now() - startT).toFixed(2)),
        generations: generationsRequired,
        fitnessProgression
    };
};

export const pointsToSVGPath = (points: Point[]): string => {
    if (!points || points.length === 0) return "";
    const parts = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(p.x)} ${Math.round(p.y)}`);
    return parts.join(' ');
};

export const analyzePathEnergy = (points: Point[], useAltitudeCost: boolean, windDirection: 'N' | 'S' | 'E' | 'W' = 'N', windStrength: number = 0): { energy: number, distance: number, turns: number } => {
    if (points.length < 2) return { energy: 0, distance: 0, turns: 0 };

    let dist = 0;
    let turns = 0;
    let altitudeChangeCost = 0;
    let energy = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const d = heuristicEuclidean(p1, p2);
        dist += d;

        const windMult = getWindMultiplier(p1, p2, windDirection, windStrength);
        const cellMoves = d / CELL_SIZE;
        energy += (cellMoves * ENERGY_COST_PER_MOVE * windMult);

        if (useAltitudeCost && p1.z !== undefined && p2.z !== undefined) {
            altitudeChangeCost += Math.abs(p2.z! - p1.z!) * ALTITUDE_COST_PER_UNIT;
        }

        if (i > 0) {
            const v1 = { x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y };
            const v2 = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y };

            const dot = v1.x * v2.x + v1.y * v2.y;
            const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            if (len1 > 0 && len2 > 0) {
                const angle = Math.acos(Math.max(-1, Math.min(1, dot / (len1 * len2))));
                if (angle > 0.5) turns++;
            }
        }
    }

    energy += (turns * ENERGY_PENALTY_TURN) + altitudeChangeCost;

    return { energy: Math.round(energy), distance: Math.round(dist), turns };
};
