import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, DollarSign, Bed, Maximize, ChevronUp, ChevronDown, Building2, ShieldCheck, Crown, Star, Award, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { LOCATIONS, CATEGORIES } from '@/types';
import { PROPERTIES as FEATURED_PROPERTIES, FEATURED_RESORTS } from '@/data/mockData';

const FEATURED_AGENTS = [
  {
    name: 'Carlos Macuácua',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    rating: 5.0,
    reviews: 124,
    propertiesSold: 45,
    agency: 'Remax Moçambique'
  },
  {
    name: 'Ana Langa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    rating: 4.9,
    reviews: 89,
    propertiesSold: 32,
    agency: 'Century 21'
  },
  {
    name: 'João Sitoe',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    rating: 4.8,
    reviews: 56,
    propertiesSold: 28,
    agency: 'ERA Imobiliária'
  },
  {
    name: 'Maria Silva',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    rating: 5.0,
    reviews: 112,
    propertiesSold: 50,
    agency: 'Pam Golding'
  }
];

export function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);

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
      {/* Hero Section */}
      <section className="relative bg-[#cb6ce6] py-20 sm:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://i.ibb.co/9HtKhj7v/Chat-GPT-Image-Mar-5-2026-10-33-16-AM.png"
            alt="Família feliz"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#cb6ce6]/60 to-[#cb6ce6]/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            O Maior Shopping de imóveis em <span className="text-brand-green">Moçambique</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            A forma mais simples e segura de comprar, vender ou arrendar o teu place.
          </p>

          {/* Search Box */}
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300">
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
          </div>
        </div>
      </section>

      {/* Premium Agencies Carousel */}
      <section className="py-10 bg-white border-b border-gray-100 overflow-hidden">
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
            {[
              { name: "Remax Moçambique", icon: Building2, color: "text-red-600" },
              { name: "Century 21", icon: Crown, color: "text-yellow-600" },
              { name: "ERA Imobiliária", icon: HomeIcon, color: "text-blue-600" },
              { name: "Pam Golding", icon: ShieldCheck, color: "text-emerald-700" },
              { name: "Sotheby's", icon: Star, color: "text-slate-800" },
              { name: "Keller Williams", icon: Building2, color: "text-red-500" },
              { name: "Zome Real Estate", icon: HomeIcon, color: "text-indigo-600" },
              { name: "Sable Imóveis", icon: Crown, color: "text-amber-700" },
              { name: "Kamiva Property", icon: Building2, color: "text-brand-green" },
            ].map((agency, idx) => (
              <div key={`agency-1-${idx}`} className="flex items-center gap-3 mx-8 sm:mx-12 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer">
                <agency.icon className={`h-8 w-8 ${agency.color}`} />
                <span className="text-xl font-bold text-gray-800 whitespace-nowrap">{agency.name}</span>
              </div>
            ))}
            
            {/* Second set of logos (duplicated for seamless loop) */}
            {[
              { name: "Remax Moçambique", icon: Building2, color: "text-red-600" },
              { name: "Century 21", icon: Crown, color: "text-yellow-600" },
              { name: "ERA Imobiliária", icon: HomeIcon, color: "text-blue-600" },
              { name: "Pam Golding", icon: ShieldCheck, color: "text-emerald-700" },
              { name: "Sotheby's", icon: Star, color: "text-slate-800" },
              { name: "Keller Williams", icon: Building2, color: "text-red-500" },
              { name: "Zome Real Estate", icon: HomeIcon, color: "text-indigo-600" },
              { name: "Sable Imóveis", icon: Crown, color: "text-amber-700" },
              { name: "Kamiva Property", icon: Building2, color: "text-brand-green" },
            ].map((agency, idx) => (
              <div key={`agency-2-${idx}`} className="flex items-center gap-3 mx-8 sm:mx-12 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer">
                <agency.icon className={`h-8 w-8 ${agency.color}`} />
                <span className="text-xl font-bold text-gray-800 whitespace-nowrap">{agency.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Destaques da Semana</h2>
              <p className="mt-2 text-gray-600">Imóveis promovidos e recomendados.</p>
            </div>
            <Link to="/properties" className="hidden sm:block text-brand-green font-medium hover:text-brand-green-hover">
              Ver todos os imóveis &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_PROPERTIES.filter(p => p.isPromoted).map((property) => (
              <PropertyCard key={property.id} property={property} />
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
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Resorts & Hotéis</h2>
              <p className="mt-2 text-gray-600">As melhores estadias para as suas férias ou viagens de negócios.</p>
            </div>
            <Link to="/properties?category=Resort" className="hidden sm:block text-brand-green font-medium hover:text-brand-green-hover">
              Ver todos &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_RESORTS.map((resort) => (
              <Link key={resort.id} to={`/resort/${resort.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer block">
                <div className="relative h-48 overflow-hidden">
                  <img src={resort.image} alt={resort.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                    <span className="text-sm font-bold text-gray-900">{resort.rating}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-brand-green transition-colors">{resort.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{resort.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <p className="text-brand-purple font-bold">
                      {resort.price} <span className="text-sm font-normal text-gray-500">/noite</span>
                    </p>
                    <Button variant="outline" size="sm" className="text-brand-green border-brand-green hover:bg-brand-green/10">
                      Reservar
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Agentes em Destaque</h2>
            <p className="mt-2 text-gray-600">Os profissionais mais bem avaliados e com melhor desempenho.</p>
          </div>

          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 sm:gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {FEATURED_AGENTS.map((agent, idx) => (
              <Link key={idx} to={`/agent/${encodeURIComponent(agent.name)}`} className="group min-w-[200px] sm:min-w-[220px] snap-center flex-shrink-0">
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
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Explore no Mapa</h2>
            <p className="mt-2 text-gray-600">Encontre imóveis em todas as províncias de Moçambique.</p>
          </div>
          <PropertyMap />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Explorar por Categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat} to={`/category/${cat.toLowerCase()}`} className="group cursor-pointer">
                <div className="bg-gray-50 rounded-xl p-6 text-center hover:bg-brand-green/10 transition-colors border border-gray-100 hover:border-brand-green">
                  <HomeIcon className="h-8 w-8 mx-auto text-brand-purple mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-gray-900">{cat}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-brand-purple/20"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Quer vender ou arrendar o seu imóvel?</h2>
              <p className="text-xl text-gray-300 mb-8">
                  Junte-se a milhares de proprietários e alcance potenciais clientes em todo Moçambique.
              </p>
              <Link to="/add-property">
                <Button size="lg" className="bg-brand-green text-white hover:bg-brand-green-hover font-bold px-8">
                    Anunciar Agora (Grátis)
                </Button>
              </Link>
          </div>
      </section>
    </div>
  );
}
