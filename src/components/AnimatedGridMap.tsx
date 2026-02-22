import { motion, useScroll, useTransform } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import './AnimatedGridMap.css';

export const AnimatedGridMap = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { scrollYProgress } = useScroll();
    const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacityFade = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate normalized mouse position (-1 to 1)
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <motion.div
            className="grid-container map-perspective"
            style={{ y: yParallax, opacity: opacityFade }}
        >
            {/* The scrolling grid background */}
            <div className="grid-plane" />

            {/* Radar scanning effect */}
            <div className="radar-scanner" />

            {/* Grid crosshairs/markers */}
            <div className="grid-marker top-left" />
            <div className="grid-marker top-right" />
            <div className="grid-marker bottom-left" />
            <div className="grid-marker bottom-right" />

            {/* The Drone Icon that moves slightly based on mouse parallax */}
            <motion.div
                className="drone-icon-container glass-panel"
                animate={{
                    x: mousePosition.x * 30,
                    y: mousePosition.y * 30,
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            >
                <Navigation className="drone-icon neon-text-blue" size={32} />

                {/* Drone tracking path trail */}
                <svg className="drone-trail" width="200" height="200" viewBox="0 0 200 200">
                    <motion.path
                        d="M 10 190 Q 50 150 100 100 T 190 10"
                        fill="transparent"
                        stroke="var(--neon-blue)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                </svg>

                {/* Pulse rings around drone */}
                <div className="drone-pulse ring-1" />
                <div className="drone-pulse ring-2" />
            </motion.div>
        </motion.div>
    );
};
