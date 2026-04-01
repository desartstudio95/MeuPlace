import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-grow w-full overflow-x-hidden"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
