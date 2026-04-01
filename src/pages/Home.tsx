import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MapPin, Home as HomeIcon, DollarSign, Bed, Maximize, ChevronUp, ChevronDown, Building2, ShieldCheck, Crown, Star, Award, User, Key, Heart, MousePointer2, Sparkles, Hotel, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { LOCATIONS, CATEGORIES, Property, PremiumAgency, Resort } from '@/types';
import { collection, query, getDocs, getDocsFromServer, limit, where, doc, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

import { LoadingScreen } from '@/components/LoadingScreen';
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
        const querySnapshot = await getDocsFromServer(q);
        const fetchedProperties: Property[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
        });
        
        setFeaturedProperties(fetchedProperties);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'properties');
      }
    };

    const fetchPremiumAgencies = async () => {
      try {
        const agenciesQ = query(collection(db, 'premium_agencies'), where('isActive', '==', true));
        const agenciesSnapshot = await getDocsFromServer(agenciesQ);
        const fetchedAgencies: PremiumAgency[] = [];
        agenciesSnapshot.forEach((doc) => {
          fetchedAgencies.push({ id: doc.id, ...doc.data() } as PremiumAgency);
        });
        
        // Sort in memory to avoid requiring a composite index
        fetchedAgencies.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setPremiumAgencies(fetchedAgencies);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'premium_agencies');
      }
    };

    const fetchResorts = async () => {
      try {
        const resortsQ = query(collection(db, 'resorts'), limit(6));
        const resortsSnapshot = await getDocsFromServer(resortsQ);
        const fetchedResorts: Resort[] = [];
        resortsSnapshot.forEach((doc) => {
          fetchedResorts.push({ id: doc.id, ...doc.data() } as Resort);
        });
        setResorts(fetchedResorts);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'resorts');
      }
    };

    const fetchFeaturedAgents = async () => {
      try {
        const agentsQ = query(collection(db, 'featured_agents'));
        const agentsSnapshot = await getDocsFromServer(agentsQ);
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
        handleFirestoreError(error, OperationType.GET, 'featured_agents');
      }
    };

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDocFromServer(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/general');
      }
    };

    fetchFeaturedProperties();
    fetchPremiumAgencies();
    fetchResorts();
    fetchFeaturedAgents();
    fetchSettings();
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
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
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-brand-purple">
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            src={settings.heroImage}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/40 via-brand-purple/70 to-brand-purple/95" />
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[10%] text-white/10"
            >
              <HomeIcon size={120} />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[20%] right-[15%] text-white/10"
            >
              <Key size={100} />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[40%] right-[10%] text-white/5"
            >
              <Heart size={80} />
            </motion.div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>O Maior Shopping de Imóveis em Moçambique</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: settings.heroTitle.replace('Moçambique', '<span class="text-brand-green drop-shadow-[0_0_15px_rgba(114,227,49,0.5)]">Moçambique</span>') }}>
            </h1>
            <p className="text-lg sm:text-2xl text-gray-200 max-w-3xl mx-auto mb-12 font-medium">
              {settings.heroSubtitle}
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-5xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-3 text-gray-800 font-semibold">
                <div className="p-2 bg-brand-green/10 rounded-lg">
                  <Search className="h-5 w-5 text-brand-green" />
                </div>
                <span>Encontre seu imóvel ideal</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className="h-10 w-10 p-0 text-gray-500 hover:text-brand-purple hover:bg-brand-purple/10 rounded-full"
              >
                {isSearchExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
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

          {/* Scroll Down Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Explorar</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Premium Agencies Carousel */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-white relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cb6ce6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-xs font-bold uppercase tracking-widest mb-4 border border-brand-purple/20">
              <Crown className="h-3 w-3" />
              <span>Parceiros de Elite</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Imobiliárias Premium</h2>
            <div className="h-1 w-20 bg-brand-purple rounded-full"></div>
          </div>
        </div>
        
        <div className="relative w-full flex overflow-x-hidden group">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10"></div>
          
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center py-4">
            {/* First set of logos */}
            {premiumAgencies.length > 0 && (
              premiumAgencies.map((agency, idx) => (
                <div key={`agency-1-${agency.id}`} className="flex items-center gap-3 mx-10 sm:mx-16 transition-all duration-300 hover:scale-110 cursor-pointer group/logo">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover/logo:shadow-xl group-hover/logo:border-brand-purple/30 transition-all duration-300">
                    {agency.websiteUrl ? (
                      <a href={agency.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        {agency.logoUrl ? (
                          <img src={agency.logoUrl} alt={agency.name} className="h-20 sm:h-24 object-contain max-w-[250px] filter grayscale group-hover/logo:grayscale-0 transition-all duration-500" />
                        ) : (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-16 w-16 text-gray-400 group-hover/logo:text-brand-purple transition-colors" />
                            <span className="text-3xl font-bold text-gray-800 whitespace-nowrap group-hover/logo:text-brand-purple transition-colors">{agency.name}</span>
                          </div>
                        )}
                      </a>
                    ) : (
                      <>
                        {agency.logoUrl ? (
                          <img src={agency.logoUrl} alt={agency.name} className="h-20 sm:h-24 object-contain max-w-[250px] filter grayscale group-hover/logo:grayscale-0 transition-all duration-500" />
                        ) : (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-16 w-16 text-gray-400 group-hover/logo:text-brand-purple transition-colors" />
                            <span className="text-3xl font-bold text-gray-800 whitespace-nowrap group-hover/logo:text-brand-purple transition-colors">{agency.name}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Second set of logos (duplicated for seamless loop) */}
            {premiumAgencies.length > 0 && (
              premiumAgencies.map((agency, idx) => (
                <div key={`agency-2-${agency.id}`} className="flex items-center gap-3 mx-10 sm:mx-16 transition-all duration-300 hover:scale-110 cursor-pointer group/logo">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover/logo:shadow-xl group-hover/logo:border-brand-purple/30 transition-all duration-300">
                    {agency.websiteUrl ? (
                      <a href={agency.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        {agency.logoUrl ? (
                          <img src={agency.logoUrl} alt={agency.name} className="h-20 sm:h-24 object-contain max-w-[250px] filter grayscale group-hover/logo:grayscale-0 transition-all duration-500" />
                        ) : (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-16 w-16 text-gray-400 group-hover/logo:text-brand-purple transition-colors" />
                            <span className="text-3xl font-bold text-gray-800 whitespace-nowrap group-hover/logo:text-brand-purple transition-colors">{agency.name}</span>
                          </div>
                        )}
                      </a>
                    ) : (
                      <>
                        {agency.logoUrl ? (
                          <img src={agency.logoUrl} alt={agency.name} className="h-20 sm:h-24 object-contain max-w-[250px] filter grayscale group-hover/logo:grayscale-0 transition-all duration-500" />
                        ) : (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-16 w-16 text-gray-400 group-hover/logo:text-brand-purple transition-colors" />
                            <span className="text-3xl font-bold text-gray-800 whitespace-nowrap group-hover/logo:text-brand-purple transition-colors">{agency.name}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.section>

      {/* Featured Section */}
      <section className="py-16 bg-gray-50 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand-green/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-brand-purple/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6"
          >
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-widest mb-3 border border-brand-green/20">
                <Sparkles className="h-3 w-3" />
                <span>Oportunidades Únicas</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Destaques da Semana</h2>
              <p className="mt-2 text-base text-gray-600 max-w-xl">Imóveis selecionados pela nossa equipa pela sua excelente relação qualidade-preço.</p>
            </div>
            <Link to="/properties" className="group flex items-center gap-2 text-brand-green font-bold hover:text-brand-green-hover transition-all text-sm">
              <span>Explorar todos os imóveis</span>
              <div className="p-1.5 bg-brand-green/10 rounded-full group-hover:bg-brand-green group-hover:text-white transition-all">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredProperties.map((property) => (
              <motion.div
                key={property.id}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="hover:translate-y-[-8px] transition-transform duration-300"
              >
                <PropertyCard property={property} isHighlighted={true} />
              </motion.div>
            ))}
          </motion.div>
           
           <div className="mt-12 text-center sm:hidden">
            <Link to="/properties">
                <Button variant="outline" className="w-full h-14 border-brand-green text-brand-green text-lg font-bold hover:bg-brand-green/10">
                    Ver todos os imóveis
                </Button>
            </Link>
           </div>
        </div>
      </section>

      {/* Resorts & Hotels Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#72e331 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6"
          >
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-[10px] font-bold uppercase tracking-widest mb-3 border border-brand-purple/20">
                <Hotel className="h-3 w-3" />
                <span>Estadias de Luxo</span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Resorts & Hotéis</h2>
              <p className="mt-2 text-base text-gray-600 max-w-xl">As melhores estadias para as suas férias ou viagens de negócios.</p>
            </div>
            <Link to="/properties?category=Resort" className="group flex items-center gap-2 text-brand-purple font-bold hover:text-brand-purple-hover transition-all text-sm">
              <span>Ver todos os destinos</span>
              <div className="p-1.5 bg-brand-purple/10 rounded-full group-hover:bg-brand-purple group-hover:text-white transition-all">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {resorts.map((resort, idx) => (
              <motion.div
                key={resort.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/resort/${resort.id}`} className="group block bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 h-full">
                  <div className="relative h-64 overflow-hidden">
                    <img src={resort.image} alt={resort.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-bold text-gray-900">{resort.rating}</span>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <Button className="w-full bg-white text-brand-purple hover:bg-brand-purple hover:text-white font-bold rounded-xl shadow-xl">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-brand-purple text-[10px] font-bold uppercase tracking-widest mb-2">
                      <Crown className="h-3 w-3" />
                      <span>Premium Choice</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-brand-purple transition-colors leading-tight">{resort.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-1.5 text-brand-green flex-shrink-0" />
                      <span className="truncate font-medium">{resort.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Preço por noite</p>
                        <p className="text-xl text-brand-purple font-black">
                          {resort.price}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section className="py-16 bg-gray-50 relative overflow-hidden">
        {/* Decorative Shapes */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-[10px] font-bold uppercase tracking-widest mb-3 border border-brand-purple/20">
              <Users className="h-3 w-3" />
              <span>Equipa de Sucesso</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{settings.featuredAgentsTitle}</h2>
            <p className="mt-2 text-base text-gray-600 max-w-2xl mx-auto">{settings.featuredAgentsSubtitle}</p>
          </motion.div>

          <div className="flex overflow-x-auto pb-12 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 sm:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {featuredAgents.length > 0 ? (
              featuredAgents.map((agent, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group min-w-[280px] sm:min-w-[320px] snap-center flex-shrink-0"
                >
                  <Link to={`/agent/${encodeURIComponent(agent.name)}`} className="block h-full">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:border-brand-purple/20 transition-all duration-500 text-center h-full flex flex-col relative overflow-hidden">
                      {/* Card background decoration */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-150 duration-700"></div>
                      
                      <div className="relative mx-auto mb-6">
                        <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:border-brand-purple/30 transition-all duration-500 mx-auto relative z-10">
                          <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        {agent.rating >= 4.9 && (
                          <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 text-white p-2.5 rounded-full shadow-xl z-20 border-2 border-white">
                            <Award className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-brand-purple transition-colors mb-1">{agent.name}</h3>
                        <p className="text-sm text-brand-purple font-bold uppercase tracking-widest mb-4">{agent.agency}</p>
                        
                        <div className="flex items-center justify-center gap-2 mb-6">
                          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            <Star className="h-4 w-4 text-amber-500 fill-current" />
                            <span className="font-black text-gray-900 text-sm">{agent.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-400 text-xs font-medium">({agent.reviews} avaliações)</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                          <div className="text-center">
                            <p className="font-black text-gray-900 text-lg leading-none mb-1">{agent.propertiesSold}</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Imóveis</p>
                          </div>
                          <div className="text-center border-l border-gray-50">
                            <p className="font-black text-brand-green text-lg leading-none mb-1">Top</p>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Performance</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-4">
                        <Button className="w-full bg-gray-900 text-white group-hover:bg-brand-purple transition-colors rounded-xl font-bold py-6">
                          Ver Perfil Completo
                        </Button>
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
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900">Explore no Mapa</h2>
            <p className="mt-2 text-sm text-gray-600">Encontre imóveis em todas as províncias de Moçambique.</p>
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
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-gray-900 mb-6 text-center"
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
