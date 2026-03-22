import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle, ChevronLeft, Star, User, Instagram, Facebook, Award, Building2, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/PropertyCard';
import { PROPERTIES } from '@/data/mockData';
import { Agent, Property } from '@/types';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function AgentProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!name) return;
      
      setLoading(true);
      const decodedName = decodeURIComponent(name);
      
      try {
        // Try to fetch agent from users collection first
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('displayName', '==', decodedName));
        const userSnapshot = await getDocs(userQuery);
        
        let foundAgent: Agent | null = null;
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          foundAgent = {
            name: userData.displayName || decodedName,
            email: userData.email,
            phone: userData.phone || '',
            whatsapp: userData.whatsapp || userData.phone || '',
            avatar: userData.photoURL || '',
            bio: userData.bio || '',
            instagram: userData.instagram || '',
            facebook: userData.facebook || '',
            agency: userData.agencyName || '',
            isVerified: userData.isApproved !== false,
            role: userData.role
          };
        }

        // Fetch properties from Firebase where agent.name matches
        const q = query(collection(db, 'properties'), where('agent.name', '==', decodedName));
        const querySnapshot = await getDocs(q);
        
        const fetchedProperties: Property[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
        });

        // Combine with mock data for now
        const mockProperties = PROPERTIES.filter(p => p.agent?.name === decodedName);
        const allProperties = [...fetchedProperties, ...mockProperties].filter(p => p.isApproved !== false);
        
        setAgentProperties(allProperties);

        if (foundAgent) {
          setAgent(foundAgent);
        } else if (allProperties.length > 0 && allProperties[0].agent) {
          setAgent(allProperties[0].agent);
        }
      } catch (error) {
        console.error("Error fetching agent properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [name]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

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

  const handleBack = () => {
    navigate(-1);
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={handleBack}
        className="flex items-center text-gray-500 hover:text-brand-green transition-colors mb-6 group"
      >
        <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Voltar
      </button>

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
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {agent.name}
                  {agent.isVerified && (
                    <BadgeCheck className="h-7 w-7 text-blue-500" title="Agente Verificado" />
                  )}
                </h1>
                {agent.rating && agent.rating >= 4.9 && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    <Award className="h-3.5 w-3.5" />
                    {agent.role === 'resort' ? 'Resort 5 Estrelas' : 'Agente 5 Estrelas'}
                  </span>
                )}
              </div>
              {agent.agency && (
                <p className="text-brand-purple font-medium mt-1 text-center sm:text-left">{agent.agency}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                {agent.rating && (
                  <div className="flex items-center text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-gray-900 ml-1">{agent.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm ml-1 font-medium">({agent.reviews || 0} avaliações)</span>
                  </div>
                )}
                {agent.propertiesSold && (
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-3 hidden sm:block"></div>
                    <span className="font-bold text-gray-900 mr-1">{agent.propertiesSold}</span>
                    <span className="text-sm">imóveis vendidos</span>
                  </div>
                )}
                {agent.yearsOfExperience && (
                  <div className="flex items-center text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-3 hidden sm:block"></div>
                    <span className="font-bold text-gray-900 mr-1">{agent.yearsOfExperience}</span>
                    <span className="text-sm">anos de experiência</span>
                  </div>
                )}
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
                  {agent.bio || (agent.role === 'resort' 
                    ? `${agent.name} é um resort/hotel parceiro verificado no MeuPlace, oferecendo as melhores acomodações e serviços para a sua estadia.`
                    : `${agent.name} é um agente imobiliário verificado no MeuPlace, dedicado a ajudar clientes a encontrar o imóvel ideal. Com uma seleção cuidadosa de propriedades, oferece um serviço profissional e transparente.`)}
                </p>
              </div>
            </div>
            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-900">Informações de Contato</h3>
              <div className="space-y-3 text-sm text-gray-600">
                {agent.agency && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-brand-green" />
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      {agent.agency}
                      {agent.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" title="Agência Verificada" />}
                    </span>
                  </div>
                )}
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
                {(agent.instagram || agent.facebook) && (
                  <div className="pt-3 mt-3 border-t border-gray-200 flex gap-4">
                    {agent.instagram && (
                      <a href={agent.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600 transition-colors">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {agent.facebook && (
                      <a href={agent.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
