import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, DollarSign, Bed, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { LOCATIONS, CATEGORIES } from '@/types';
import { PROPERTIES as FEATURED_PROPERTIES } from '@/data/mockData';

export function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [minArea, setMinArea] = useState('');

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
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1973&q=80"
            alt="Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#cb6ce6]/60 to-[#cb6ce6]/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            O Maior Shopping de imóveis em <span className="text-brand-green">Moçambique</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            A forma mais simples e segura de comprar, vender ou arrendar imóveis.
          </p>

          {/* Search Box */}
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl p-4 sm:p-6">
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
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                  className="w-full h-12 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">Localização</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <HomeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                  className="w-full h-12 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Categoria</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select 
                  className="w-full h-12 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Destaques da Semana</h2>
              <p className="mt-2 text-gray-600">Imóveis mais visitados e recomendados.</p>
            </div>
            <Link to="/properties" className="hidden sm:block text-brand-green font-medium hover:text-brand-green-hover">
              Ver todos os imóveis &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_PROPERTIES.map((property) => (
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
