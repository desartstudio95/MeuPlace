import React from 'react';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <div className="w-24 h-24 border-4 border-brand-green/20 border-t-brand-green border-r-brand-purple/40 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="h-10 w-10 text-brand-green" />
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-2">
            <span className="text-brand-green">Meu</span>
            <span className="text-brand-purple">Place</span>
          </h2>
          <p className="text-gray-500 font-medium animate-pulse">Carregando a sua experiência...</p>
        </motion.div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-brand-green' : 'bg-brand-purple'}`}
          />
        ))}
      </div>
    </div>
  );
}
