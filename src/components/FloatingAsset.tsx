import { motion } from 'framer-motion';
import { useRef } from 'react';

interface FloatingAssetProps {
  src: string;
  size: number;
  initialTop: number;
  initialLeft: number;
  delay?: number;
  duration?: number;
}

export function FloatingAsset({ src, size, initialTop, initialLeft, delay = 0, duration = 6 }: FloatingAssetProps) {
  const constraintsRef = useRef(null);

  // Randomize float direction slightly
  const yOffset = -20 - Math.random() * 10;
  const rotateOffset = Math.random() * 10 - 5;

  return (
    <motion.div
      ref={constraintsRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <motion.img
        src={src}
        alt=""
        drag
        dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
        dragElastic={0.2}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        whileHover={{ rotate: 10, cursor: 'grab', zIndex: 50 }}
        whileTap={{ cursor: 'grabbing' }}
        initial={{ 
          top: `${initialTop}%`, 
          left: `${initialLeft}%`, 
          y: 0,
          rotate: 0
        }}
        animate={{ 
          y: [0, yOffset, 0],
          rotate: [0, rotateOffset, 0]
        }}
        transition={{
          y: {
            duration: duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay
          },
          rotate: {
            duration: duration * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay
          }
        }}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          pointerEvents: 'auto',
          imageRendering: 'pixelated'
        }}
        className="pixel-render"
      />
    </motion.div>
  );
}
