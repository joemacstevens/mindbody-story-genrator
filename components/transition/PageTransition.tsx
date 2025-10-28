import React from 'react';
import type { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';

const transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const PageTransition: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={transition}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
