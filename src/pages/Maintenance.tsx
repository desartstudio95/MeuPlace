import { motion } from 'motion/react';
import { Wrench, Settings, RefreshCw } from 'lucide-react';
import { SEO } from '@/components/SEO';

export function Maintenance() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <SEO 
        title="Em Manutenção" 
        description="Nosso site está temporariamente indisponível para manutenção."
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg w-full relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-green" />
        
        <div className="flex justify-center mb-8 relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute"
          >
            <Settings className="w-24 h-24 text-gray-100" />
          </motion.div>
          <Wrench className="w-12 h-12 text-brand-green relative z-10 mt-6" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Estamos em Manutenção
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          Nossa equipe está trabalhando nos bastidores para trazer melhorias e novidades. 
          Voltaremos em breve com uma experiência ainda melhor!
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-3 px-4 rounded-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Por favor, tente acessar novamente mais tarde.</span>
        </div>
      </motion.div>
    </div>
  );
}
