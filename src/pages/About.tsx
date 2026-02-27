import { Layout } from '@/components/layout/Layout';

export function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Sobre o MeuPlace</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A nossa missão é simplificar o mercado imobiliário em Moçambique, conectando pessoas aos seus sonhos através da tecnologia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Quem Somos</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            O MeuPlace é a plataforma líder em Moçambique para compra, venda e arrendamento de imóveis. Fundada com a visão de trazer transparência e facilidade ao setor imobiliário, oferecemos uma experiência digital completa para proprietários, agentes e compradores.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Combinamos tecnologia de ponta com um profundo conhecimento do mercado local para oferecer as melhores soluções para as suas necessidades imobiliárias.
          </p>
        </div>
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
          <img 
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
            alt="Maputo Skyline" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl font-bold text-brand-green mb-2">500+</div>
          <div className="text-gray-600 font-medium">Imóveis Listados</div>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl font-bold text-brand-purple mb-2">2k+</div>
          <div className="text-gray-600 font-medium">Usuários Ativos</div>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl font-bold text-brand-green mb-2">10+</div>
          <div className="text-gray-600 font-medium">Cidades Cobertas</div>
        </div>
      </div>
    </div>
  );
}
