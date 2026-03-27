import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MapPin, Home as HomeIcon, DollarSign, Bed, Maximize, ChevronUp, ChevronDown, Building2, ShieldCheck, Crown, Star, Award, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { LOCATIONS, CATEGORIES, Property, PremiumAgency, Resort } from '@/types';
import { collection, query, getDocs, limit, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

import { SEO } from '@/components/SEO';

export function Home() {
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [premiumAgencies, setPremiumAgencies] = useState<PremiumAgency[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    heroImage: 'https://i.ibb.co/9HtKhj7v/Chat-GPT-Image-Mar-5-2026-10-33-16-AM.png',
    heroTitle: 'O Maior Shopping de imóveis em Moçambique',
    heroSubtitle: 'A forma mais simples e segura de comprar, vender ou arrendar o teu place.',
    featuredAgentsTitle: 'Agentes em Destaque',
    featuredAgentsSubtitle: 'Os profissionais mais bem avaliados e com melhor desempenho.'
  });

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const q = query(collection(db, 'properties'), where('isPromoted', '==', true), limit(6));
        const querySnapshot = await getDocs(q);
        const fetchedProperties: Property[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
        });
        
        setFeaturedProperties(fetchedProperties);
      } catch (error) {
        console.error("Error fetching featured properties:", error);
      }
    };

    const fetchPremiumAgencies = async () => {
      try {
        const agenciesQ = query(collection(db, 'premium_agencies'), where('isActive', '==', true));
        const agenciesSnapshot = await getDocs(agenciesQ);
        const fetchedAgencies: PremiumAgency[] = [];
        agenciesSnapshot.forEach((doc) => {
          fetchedAgencies.push({ id: doc.id, ...doc.data() } as PremiumAgency);
        });
        
        // Sort in memory to avoid requiring a composite index
        fetchedAgencies.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setPremiumAgencies(fetchedAgencies);
      } catch (error) {
        console.error("Error fetching premium agencies:", error);
      }
    };

    const fetchResorts = async () => {
      try {
        const resortsQ = query(collection(db, 'resorts'), limit(6));
        const resortsSnapshot = await getDocs(resortsQ);
        const fetchedResorts: Resort[] = [];
        resortsSnapshot.forEach((doc) => {
          fetchedResorts.push({ id: doc.id, ...doc.data() } as Resort);
        });
        setResorts(fetchedResorts);
      } catch (error) {
        console.error("Error fetching resorts:", error);
      }
    };

    const fetchFeaturedAgents = async () => {
      try {
        const agentsQ = query(collection(db, 'featured_agents'));
        const agentsSnapshot = await getDocs(agentsQ);
        const fetchedAgents: any[] = [];
        agentsSnapshot.forEach((doc) => {
          fetchedAgents.push({ id: doc.id, ...doc.data() });
        });
        
        fetchedAgents.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (fetchedAgents.length > 0) {
          setFeaturedAgents(fetchedAgents);
        } else {
          setFeaturedAgents([]);
        }
      } catch (error) {
        console.error("Error fetching featured agents:", error);
      }
    };

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchFeaturedProperties();
    fetchPremiumAgencies();
    fetchResorts();
    fetchFeaturedAgents();
    fetchSettings();
  }, []);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (userProfile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (category) params.append('category', category);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (minArea) params.append('minArea', minArea);
    
    // Note: searchTerm is not currently used in Properties filter logic in the provided snippet, 
    // but we can pass it as a generic 'q' param or map it to title search if implemented later.
    // For now, let's assume the user wants to filter by the explicit fields.
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title="Início" 
        description={settings.heroSubtitle || "A forma mais simples e segura de comprar, vender ou arrendar o teu place."} 
      />
      {/* Hero Section */}
      <section className="relative bg-[#cb6ce6] py-20 sm:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={settings.heroImage}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#cb6ce6]/60 to-[#cb6ce6]/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6" dangerouslySetInnerHTML={{ __html: settings.heroTitle.replace('Moçambique', '<span class="text-brand-green">Moçambique</span>') }}>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              {settings.heroSubtitle}
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Search className="h-4 w-4" />
                <span>Encontre seu imóvel ideal</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                {isSearchExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
            
            {isSearchExpanded && (
              <div className="p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="col-span-1 sm:col-span-2 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="O que procura? (ex: Apartamento T3)" 
                      className="pl-10 h-12 text-base"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select 
                      className="w-full h-12 pl-10 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option value="">Localização</option>
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <HomeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select 
                      className="w-full h-12 pl-10 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Categoria</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number"
                      placeholder="Preço Máx (MZN)" 
                      className="pl-10 h-12 text-base"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select 
                      className="w-full h-12 pl-10 pr-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    >
                      <option value="">Quartos</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <Maximize className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number"
                      placeholder="Área Mín (m²)" 
                      className="pl-10 h-12 text-base"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="h-12 bg-brand-green hover:bg-brand-green-hover text-lg font-medium w-full"
                    onClick={handleSearch}
                  >
                    Pesquisar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Premium Agencies Carousel */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-10 bg-white border-b border-gray-100 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Imobiliárias Premium
          </p>
        </div>
        
        <div className="relative w-full flex overflow-x-hidden group">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
          
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center">
            {/* First set of logos */}
            {premiumAgencies.length > 0 && (
              premiumAgencies.map((agency, idx) => (
                <div key={`agency-1-${agency.id}`} className="flex items-center gap-3 mx-8 sm:mx-12 transition-transform hover:scale-105 cursor-pointer">
                  {agency.websiteUrl ? (
                    <a href={agency.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt={agency.name} className="h-24 object-contain max-w-[250px]" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-16 w-16 text-gray-400" />
                          <span className="text-3xl font-bold text-gray-800 whitespace-nowrap">{agency.name}</span>
                        </div>
                      )}
                    </a>
                  ) : (
                    <>
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt={agency.name} className="h-24 object-contain max-w-[250px]" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-16 w-16 text-gray-400" />
                          <span className="text-3xl font-bold text-gray-800 whitespace-nowrap">{agency.name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
            
            {/* Second set of logos (duplicated for seamless loop) */}
            {premiumAgencies.length > 0 && (
              premiumAgencies.map((agency, idx) => (
                <div key={`agency-2-${agency.id}`} className="flex items-center gap-3 mx-8 sm:mx-12 transition-transform hover:scale-105 cursor-pointer">
                  {agency.websiteUrl ? (
                    <a href={agency.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt={agency.name} className="h-24 object-contain max-w-[250px]" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-16 w-16 text-gray-400" />
                          <span className="text-3xl font-bold text-gray-800 whitespace-nowrap">{agency.name}</span>
                        </div>
                      )}
                    </a>
                  ) : (
                    <>
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt={agency.name} className="h-24 object-contain max-w-[250px]" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-16 w-16 text-gray-400" />
                          <span className="text-3xl font-bold text-gray-800 whitespace-nowrap">{agency.name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.section>

      {/* Featured Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Destaques da Semana</h2>
              <p className="mt-2 text-gray-600">Imóveis promovidos e recomendados.</p>
            </div>
            <Link to="/properties" className="hidden sm:block text-brand-green font-medium hover:text-brand-green-hover">
              Ver todos os imóveis &rarr;
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {featuredProperties.map((property, idx) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
           
           <div className="mt-8 text-center sm:hidden">
            <Link to="/properties">
                <Button variant="outline" className="w-full border-brand-green text-brand-green">
                    Ver todos os imóveis
                </Button>
            </Link>
           </div>
        </div>
      </section>

      {/* Resorts & Hotels Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Resorts & Hotéis</h2>
              <p className="mt-2 text-gray-600">As melhores estadias para as suas férias ou viagens de negócios.</p>
            </div>
            <Link to="/properties?category=Resort" className="hidden sm:block text-brand-green font-medium hover:text-brand-green-hover">
              Ver todos &rarr;
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {resorts.map((resort, idx) => (
              <motion.div
                key={resort.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/resort/${resort.id}`} className="max-w-[350px] mx-auto w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer block">
                  <div className="relative h-36 overflow-hidden">
                    <img src={resort.image} alt={resort.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                      <span className="text-xs font-bold text-gray-900">{resort.rating}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-1 group-hover:text-brand-green transition-colors leading-tight">{resort.name}</h3>
                    <div className="flex items-center text-gray-500 text-xs mb-2">
                      <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="truncate">{resort.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <p className="text-sm text-brand-purple font-bold">
                        {resort.price} <span className="text-xs font-normal text-gray-500">/noite</span>
                      </p>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] text-brand-green border-brand-green hover:bg-brand-green/10">
                        Reservar
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">{settings.featuredAgentsTitle}</h2>
            <p className="mt-2 text-gray-600">{settings.featuredAgentsSubtitle}</p>
          </motion.div>

          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 sm:gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {featuredAgents.length > 0 ? (
              featuredAgents.map((agent, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group min-w-[200px] sm:min-w-[220px] snap-center flex-shrink-0"
                >
                  <Link to={`/agent/${encodeURIComponent(agent.name)}`} className="block h-full">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-green/30 transition-all text-center h-full flex flex-col">
                      <div className="relative mx-auto mb-3">
                        <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-gray-50 group-hover:border-brand-green/20 transition-colors mx-auto">
                          <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
                        </div>
                        {agent.rating >= 4.9 && (
                          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white p-1 rounded-full shadow-sm">
                            <Award className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-green transition-colors line-clamp-1">{agent.name}</h3>
                      <p className="text-xs text-brand-purple font-medium mb-2">{agent.agency}</p>
                      
                      <div className="flex items-center justify-center gap-1 text-amber-500 mb-3">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-bold text-gray-900 ml-1 text-sm">{agent.rating.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs">({agent.reviews})</span>
                      </div>
                      
                      <div className="mt-auto pt-3 border-t border-gray-50 flex justify-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-gray-900 text-sm">{agent.propertiesSold}</p>
                          <p className="text-[10px] uppercase tracking-wider text-gray-500">Imóveis</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="w-full text-center py-12 text-gray-500">
                Nenhum agente em destaque no momento.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-gray-900">Explore no Mapa</h2>
            <p className="mt-2 text-gray-600">Encontre imóveis em todas as províncias de Moçambique.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <PropertyMap />
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 mb-8 text-center"
          >
            Explorar por Categoria
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/category/${cat.toLowerCase()}`} className="group cursor-pointer block h-full">
                  <div className="bg-gray-50 rounded-xl p-6 text-center hover:bg-brand-green/10 transition-colors border border-gray-100 hover:border-brand-green h-full">
                    <HomeIcon className="h-8 w-8 mx-auto text-brand-purple mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-gray-900">{cat}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-brand-purple/20"></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto px-4 text-center relative z-10"
          >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Quer vender ou arrendar o seu imóvel?</h2>
              <p className="text-xl text-gray-300 mb-8">
                  Junte-se a milhares de proprietários e alcance potenciais clientes em todo Moçambique.
              </p>
              <Link to="/add-property">
                <Button size="lg" className="bg-brand-green text-white hover:bg-brand-green-hover font-bold px-8">
                    Anunciar Agora (Grátis)
                </Button>
              </Link>
          </motion.div>
      </section>
    </div>
  );
}
