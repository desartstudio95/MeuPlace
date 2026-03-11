import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle, ChevronLeft, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/PropertyCard';
import { PROPERTIES } from '@/data/mockData';
import { Agent } from '@/types';

export function AgentProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentProperties, setAgentProperties] = useState<any[]>([]);

  useEffect(() => {
    if (name) {
      const decodedName = decodeURIComponent(name);
      // Find the first property that belongs to this agent to extract agent details
      const propertyWithAgent = PROPERTIES.find(p => p.agent.name === decodedName);
      
      if (propertyWithAgent) {
        setAgent(propertyWithAgent.agent);
        // Get all properties by this agent
        const properties = PROPERTIES.filter(p => p.agent.name === decodedName);
        setAgentProperties(properties);
      }
    }
  }, [name]);

  if (!agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agente não encontrado</h2>
        <p className="text-gray-500 mb-6">Não conseguimos encontrar o perfil deste agente.</p>
        <Button onClick={() => navigate('/properties')} className="bg-brand-green hover:bg-brand-green-hover">
          Ver todos os imóveis
        </Button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = `Olá ${agent.name}, vi o seu perfil no MeuPlace e gostaria de obter mais informações.`;
    window.open(`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="ghost" className="text-gray-500 hover:text-gray-900 pl-0" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5 mr-1" />
          Voltar
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="h-32 bg-gradient-to-r from-brand-green/20 to-brand-purple/20"></div>
        <div className="px-6 sm:px-10 pb-10 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16 sm:-mt-12 mb-6">
            <div className="h-32 w-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-brand-green/10 flex items-center justify-center text-4xl font-bold text-brand-green">
                  {agent.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
              <div className="flex items-center justify-center sm:justify-start text-yellow-500 mt-1">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <span className="text-gray-500 text-sm ml-2">(4.9 de 5)</span>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={handleWhatsApp} className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              {agent.email && (
                <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => window.location.href = `mailto:${agent.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Sobre</h3>
                <p className="text-gray-600 leading-relaxed">
                  {agent.bio || `${agent.name} é um agente imobiliário verificado no MeuPlace, dedicado a ajudar clientes a encontrar o imóvel ideal. Com uma seleção cuidadosa de propriedades, oferece um serviço profissional e transparente.`}
                </p>
              </div>
            </div>
            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-900">Informações de Contato</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-brand-green" />
                  <span>{agent.phone}</span>
                </div>
                {agent.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-brand-green" />
                    <span>{agent.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-brand-green" />
                  <span>Moçambique</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Imóveis de {agent.name}</h2>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            {agentProperties.length} imóveis
          </span>
        </div>
        
        {agentProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">Este agente não possui imóveis publicados no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
