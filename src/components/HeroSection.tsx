import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { GlowingButton } from './GlowingButton';
import { Play } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
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

    const wordVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const titleText = "Energy-Efficient UAV Path Optimization";
    const words = titleText.split(" ");

    return (
        <section className="hero-section">
            <motion.div
                className="hero-content container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="hero-left">
                    <motion.div variants={itemVariants} className="badge glass-panel">
                        <span className="badge-dot" /> System Online & Ready
                    </motion.div>

                    <h1 className="hero-headline">
                        {words.map((word, i) => (
                            <motion.span
                                key={i}
                                variants={wordVariants}
                                style={{ display: 'inline-block', marginRight: '16px' }}
                            >
                                {word === "UAV" || word === "Path" ? (
                                    <span className="neon-text-blue">{word}</span>
                                ) : (
                                    word
                                )}
                            </motion.span>
                        ))}
                    </h1>

                    <motion.p variants={itemVariants} className="hero-subheadline">
                        A Comparative Study of A*, Hierarchical, and Hybrid Genetic Algorithms, designed for enterprise operational efficiency.
                    </motion.p>

                    <motion.div variants={itemVariants} className="hero-actions">
                        <GlowingButton icon={<Play size={20} />} onClick={onStart}>
                            Start Simulation
                        </GlowingButton>
                    </motion.div>
                </div>

                <div className="hero-right">
                    {/* Bento Grid using SpotlightCards */}
                    <div className="bento-grid">
                        <motion.div variants={itemVariants} className="bento-item bento-wide">
                            <SpotlightCard className="bento-card">
                                <span className="metric-label">Execution Speed</span>
                                <div className="metric-compare">
                                    <div>
                                        <div className="metric-sub">A* Path</div>
                                        <div className="metric-value text-gradient">1.2ms</div>
                                    </div>
                                    <div className="metric-divider" />
                                    <div>
                                        <div className="metric-sub">HPA*</div>
                                        <div className="metric-value text-gradient">0.4ms</div>
                                    </div>
                                </div>
                            </SpotlightCard>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bento-item">
                            <SpotlightCard className="bento-card" spotlightColor="rgba(124, 58, 237, 0.15)">
                                <span className="metric-label">Genetic</span>
                                <span className="metric-value text-gradient">250 Gen</span>
                            </SpotlightCard>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bento-item">
                            <SpotlightCard className="bento-card">
                                <span className="metric-label">Efficiency</span>
                                <span className="metric-value text-gradient">+94%</span>
                            </SpotlightCard>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
