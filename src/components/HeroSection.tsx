import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { GlowingButton } from './GlowingButton';
import { Play } from 'lucide-react';
import './HeroSection.css';

export const HeroSection = ({ onStart }: { onStart: () => void }) => {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
            },
        },
    };

    return (
        <section className="hero-section">
            <motion.div
                className="hero-content container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="badge glass-panel">
                    <span className="badge-dot" /> System Online & Ready
                </motion.div>

                <motion.h1 variants={itemVariants} className="hero-headline">
                    Energy-Efficient <br />
                    <span className="neon-text-blue">UAV Path</span> Optimization
                </motion.h1>

                <motion.p variants={itemVariants} className="hero-subheadline">
                    A Comparative Study of A*, Hierarchical, and Hybrid Genetic Algorithms
                </motion.p>

                <motion.div variants={itemVariants} className="hero-actions">
                    <GlowingButton icon={<Play size={20} />} onClick={onStart}>
                        Start Simulation
                    </GlowingButton>
                </motion.div>

                {/* System status metrics - glass panels */}
                <motion.div variants={itemVariants} className="metrics-container">
                    <div className="metric-box glass-panel">
                        <span className="metric-label">A* ETA</span>
                        <span className="metric-value text-gradient">1.2ms</span>
                    </div>
                    <div className="metric-box glass-panel">
                        <span className="metric-label">HPA* ETA</span>
                        <span className="metric-value text-gradient">0.4ms</span>
                    </div>
                    <div className="metric-box glass-panel">
                        <span className="metric-label">Genetic Gen</span>
                        <span className="metric-value text-gradient">250</span>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
};
