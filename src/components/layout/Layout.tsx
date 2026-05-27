import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion } from 'motion/react';
import { useCompare } from '@/context/CompareContext';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { propertiesToCompare } = useCompare();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full relative">
      <Navbar />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-grow w-full overflow-x-hidden relative"
      >
        {children}
      </motion.main>
      <Footer />

      {propertiesToCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <Link 
            to="/compare"
            className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-full shadow-2xl hover:bg-brand-purple-hover hover:scale-105 transition-all font-bold border border-white/20 whitespace-nowrap"
          >
            <Scale className="w-5 h-5" />
            Comparar ({propertiesToCompare.length})
          </Link>
        </div>
      )}
    </div>
  );
}
