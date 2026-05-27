import React from 'react';
import { useCompare } from '@/context/CompareContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  X, AlertCircle, ArrowLeft, Bed, Bath, Square, 
  MapPin, CheckCircle2 
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function Compare() {
  const { propertiesToCompare, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (propertiesToCompare.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nada a comparar</h2>
        <p className="text-gray-500 mb-6">Você ainda não selecionou nenhum imóvel para comparação.</p>
        <Button onClick={() => navigate('/properties')} className="bg-brand-green hover:bg-brand-green-hover text-white">
          <ArrowLeft className="w-4 h-4 mr-2"/>
          Explorar Imóveis
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Helmet>
        <title>Comparador Lado-a-Lado | MeuPlace</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Comparar Imóveis</h1>
          <p className="text-gray-600 mt-1">Analisando {propertiesToCompare.length} {propertiesToCompare.length === 1 ? 'imóvel' : 'imóveis'} lado a lado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/properties')}>
            Adicionar Mais
          </Button>
          <Button variant="outline" onClick={clearCompare} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Limpar Todos
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="min-w-[800px] flex gap-4">
          
          {/* Properties columns */}
          {propertiesToCompare.map(property => (
            <div key={property.id} className="flex-1 min-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              <button 
                onClick={() => removeFromCompare(property.id)}
                className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-1.5 rounded-full z-10 transition-colors"
                title="Remover da comparação"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Image */}
              <div className="h-48 relative">
                <img 
                  src={property.images && property.images[0] ? property.images[0] : 'https://placehold.co/600x400'} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-brand-green text-white text-xs font-bold px-2 py-1 rounded">
                  {property.type}
                </div>
              </div>

              <div className="p-5">
                <Link to={`/properties/${property.id}`} className="hover:text-brand-purple transition-colors">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 min-h-[56px] leading-snug mb-2">
                    {property.title}
                  </h3>
                </Link>
                
                <p className="text-2xl font-black text-brand-purple mb-4">
                  {property.price.toLocaleString()} {property.currency}
                </p>
                
                <div className="space-y-4">
                  
                  {/* Basic Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 p-2 rounded">
                      <Bed className="w-4 h-4 text-brand-green" />
                      <span>{property.bedrooms || '-'} Quartos</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 p-2 rounded">
                      <Bath className="w-4 h-4 text-brand-green" />
                      <span>{property.bathrooms || '-'} Casas de Banho</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 p-2 rounded col-span-2">
                      <Square className="w-4 h-4 text-brand-green" />
                      <span>{property.area || '-'} m²</span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />
                  
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Localização</h4>
                    <p className="text-sm font-medium text-gray-800 flex items-start gap-1">
                      <MapPin className="w-4 h-4 shrink-0 text-brand-green mt-0.5" />
                      {property.location}
                    </p>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Financial details if available */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Dados Financeiros</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Taxa Condomínio:</span>
                        <span className="font-medium">{property.condominiumFee ? `${property.condominiumFee} ${property.currency}` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ROI Estimado:</span>
                        <span className="font-bold text-green-600">{property.roiPercentage ? `${property.roiPercentage}%/ano` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Features */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Características</h4>
                    <div className="space-y-1.5">
                      {property.features && property.features.length > 0 ? (
                        property.features.slice(0, 5).map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Nenhuma listada</span>
                      )}
                      {property.features && property.features.length > 5 && (
                        <div className="text-xs text-brand-purple font-medium pl-5 mt-1">
                          + {property.features.length - 5} outras
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-auto">
                    <Link to={`/properties/${property.id}`}>
                      <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add more placeholder */}
          {propertiesToCompare.length < 4 && (
            <div className="flex-1 min-w-[280px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center hover:border-brand-green hover:bg-brand-green/5 transition-colors cursor-pointer" onClick={() => navigate('/properties')}>
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <PlusIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-700 mb-1">Adicionar Imóvel</h3>
              <p className="text-sm text-gray-500">
                Pode comparar mais {4 - propertiesToCompare.length} {4 - propertiesToCompare.length === 1 ? 'imóvel' : 'imóveis'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
