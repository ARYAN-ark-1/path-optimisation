import { useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import './CustomCursor.css';

export const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Spring configuration for the trailing ring
    const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };

    // Create animated values for smooth trailing
    const cursorXSpring = useSpring(0, springConfig);
    const cursorYSpring = useSpring(0, springConfig);

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            cursorXSpring.set(e.clientX);
            cursorYSpring.set(e.clientY);

            if (!isVisible) setIsVisible(true);

            // Detect if hovering over clickable elements
            const target = e.target as HTMLElement;
            const isClickable = target.closest('button, a, input, select, .custom-slider, .algo-btn, .hover-target');
            setIsHovering(!!isClickable);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', updateMousePosition);
        document.body.addEventListener('mouseleave', handleMouseLeave);
        document.body.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            document.body.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [cursorXSpring, cursorYSpring, isVisible]);

    if (typeof window === 'undefined' || !isVisible) return null;

    return (
        <>
            {/* The fast, highly responsive central dot */}
            <motion.div
                className="custom-cursor-dot"
                animate={{
                    x: mousePosition.x - 4,
                    y: mousePosition.y - 4,
                    scale: isHovering ? 0 : 1, // Hide dot when hovering
                    opacity: isHovering ? 0 : 1
                }}
                transition={{ type: "tween", ease: "linear", duration: 0 }}
            />

            {/* The trailing, smooth aura ring */}
            <motion.div
                className="custom-cursor-ring"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
                animate={{
                    scale: isHovering ? 1.5 : 1,
                    backgroundColor: isHovering ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    borderColor: isHovering ? 'rgba(37, 99, 235, 0.5)' : 'rgba(100, 116, 139, 0.4)',
                }}
                transition={{ duration: 0.15 }}
            />
        </>
    );
};
