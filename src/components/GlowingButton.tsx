import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import './GlowingButton.css'; // Make sure to import styling

interface GlowingButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    icon?: ReactNode;
    primary?: boolean;
}

export const GlowingButton = ({ children, onClick, className = '', icon, primary = true }: GlowingButtonProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`glowing-btn ${primary ? 'primary' : 'secondary'} ${className}`}
            onClick={onClick}
        >
            <span className="btn-content">
                {icon && <span className="btn-icon">{icon}</span>}
                <span className="btn-text">{children}</span>
            </span>
            {/* Decorative borders/effects */}
            <span className="btn-border top" />
            <span className="btn-border right" />
            <span className="btn-border bottom" />
            <span className="btn-border left" />
        </motion.button>
    );
};
