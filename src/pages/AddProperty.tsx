import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LOCATIONS, CATEGORIES } from '@/types';
import { Upload, CheckCircle, Star, Zap, Crown, Check } from 'lucide-react';

export function AddProperty() {
  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '1');
  const [step, setStep] = useState(initialStep);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setStep(parseInt(stepParam));
    }
  }, [searchParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const packages = [
    {
      id: 'silver',
      name: 'Pacote Silver',
      price: '500 MZN',
      duration: '7 dias',
      icon: Star,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      features: ['Destaque na lista', 'Suporte básico']
    },
    {
      id: 'gold',
      name: 'Pacote Gold',
      price: '1.200 MZN',
      duration: '15 dias',
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      features: ['Topo da lista', 'Destaque na Home', 'Suporte prioritário']
    },
    {
      id: 'premium',
      name: 'Pacote Premium',
      price: '2.500 MZN',
      duration: '30 dias',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: ['Topo da lista', 'Destaque na Home', 'Redes Sociais', 'Gestor de conta']
    }
  ];

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-brand-green/10 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-brand-green" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Anúncio Recebido!</h2>
        <p className="text-gray-600 mb-8 text-lg">
          O seu imóvel foi submetido para revisão. {selectedPackage ? `Você escolheu o ${packages.find(p => p.id === selectedPackage)?.name}.` : ''} Entraremos em contacto em breve para confirmar os detalhes e o pagamento.
        </p>
        <Button onClick={() => window.location.href = '/'} className="bg-brand-green hover:bg-brand-green-hover">
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Anunciar Imóvel</h1>
        <p className="text-gray-600 mt-2">Preencha os detalhes do seu imóvel para começar.</p>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
             <span className="text-sm font-medium text-gray-500">Passo {step} de 4</span>
             <span className="text-sm font-medium text-brand-green">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-green h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Anúncio</label>
                  <Input placeholder="Ex: Apartamento T3 na Polana" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Negócio</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Venda</option>
                    <option>Arrendamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (MZN)</label>
                  <Input type="number" placeholder="0.00" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descreva os detalhes do imóvel..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-gray-900">Localização e Detalhes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro / Zona</label>
                  <Input placeholder="Ex: Polana Cimento" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
                  <Input type="number" min="0" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banheiros</label>
                  <Input type="number" min="0" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
                  <Input type="number" min="0" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-gray-900">Fotos e Contacto</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Clique para adicionar fotos</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                  <Input placeholder="Nome completo" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <Input placeholder="+258 84 000 0000" required />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Promova seu Anúncio</h3>
                <p className="text-gray-600 mt-2">Escolha um pacote para destacar seu imóvel e vender mais rápido.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const Icon = pkg.icon;
                  const isSelected = selectedPackage === pkg.id;
                  
                  return (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                      className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green ring-offset-2' 
                          : 'border-gray-200 bg-white hover:border-brand-green/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-brand-green">
                          <CheckCircle className="h-6 w-6 fill-brand-green/20" />
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${pkg.bgColor}`}>
                        <Icon className={`h-6 w-6 ${pkg.color}`} />
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                      <div className="mt-2 mb-4">
                        <span className="text-2xl font-bold text-gray-900">{pkg.price}</span>
                        <span className="text-sm text-gray-500 block">{pkg.duration}</span>
                      </div>
                      
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full ${isSelected ? 'bg-brand-green hover:bg-brand-green-hover' : ''}`}
                      >
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center text-sm text-gray-600">
                <p>Não quer promover agora? Você pode continuar com o anúncio gratuito.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            ) : (
              <div /> 
            )}
            
            {step < 4 ? (
              <Button type="button" onClick={() => setStep(step + 1)} className="bg-brand-green hover:bg-brand-green-hover">
                {step === 3 ? 'Continuar para Promoção' : 'Próximo'}
              </Button>
            ) : (
              <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover px-8 py-6 text-lg">
                {selectedPackage ? 'Pagar e Publicar' : 'Publicar Gratuitamente'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
