import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { Property, LOCATIONS, CATEGORIES } from '@/types';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, getDocsFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingScreen } from '@/components/LoadingScreen';
import { Search, Filter, X, Bell, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Map as MapIcon, List, Star } from 'lucide-react';
import { SEO } from '@/components/SEO';

export function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'properties'));
        const querySnapshot = await getDocsFromServer(q);
        const fetchedProperties: Property[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
        });
        
        setProperties(fetchedProperties);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (userProfile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    minArea: searchParams.get('minArea') || '',
  });
  
  const [sortOrder, setSortOrder] = useState('newest');
  const [showFilters, setShowFilters] = useState(true);
  const navigate = useNavigate();
  
  // Pagination state
  const [featuredCurrentPage, setFeaturedCurrentPage] = useState(1);
  const [freeCurrentPage, setFreeCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Autocomplete state
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [email, setEmail] = useState('');
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Request browser notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
    
    // Simulate API call and success
    addNotification({
      title: 'Alerta Criado com Sucesso!',
      message: `Você receberá notificações no email ${email} quando novos imóveis corresponderem aos seus filtros.`,
      type: 'success'
    });

    // Simulate finding a match shortly after (for demo purposes)
    setTimeout(() => {
      addNotification({
        title: 'Novo Imóvel Encontrado!',
        message: 'Um novo imóvel que corresponde aos seus critérios foi adicionado.',
        type: 'info',
        link: `/properties/${properties[0]?.id}` // Just linking to the first one for demo
      });
    }, 5000);

    setIsNotifyOpen(false);
    setEmail('');
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
    if (filters.minArea) params.set('minArea', filters.minArea);
    setSearchParams(params);
    setFeaturedCurrentPage(1);
    setFreeCurrentPage(1); // Reset to first page on filter change
  }, [filters, setSearchParams]);

  // Handle click outside for autocomplete
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [locationWrapperRef]);

  const filteredProperties = properties.filter(p => {
    // Filter out unapproved properties unless admin or owner
    if (!p.isApproved && userProfile?.role !== 'admin' && p.agentId !== userProfile?.uid) return false;

    // Case insensitive location search
    if (filters.location && !p.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
    if (filters.bedrooms && p.bedrooms < Number(filters.bedrooms)) return false;
    if (filters.minArea && p.area < Number(filters.minArea)) return false;
    return true;
  }).sort((a, b) => {
    // Always show promoted properties first
    if (a.isPromoted && !b.isPromoted) return -1;
    if (!a.isPromoted && b.isPromoted) return 1;

    if (sortOrder === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortOrder === 'price_asc') {
      return a.price - b.price;
    } else if (sortOrder === 'price_desc') {
      return b.price - a.price;
    }
    return 0;
  });

  // Separate featured and free properties
  const featuredProperties = filteredProperties.filter(p => p.isPromoted);
  const freeProperties = filteredProperties.filter(p => !p.isPromoted);

  // Pagination logic applies to both
  const totalFeaturedPages = Math.ceil(featuredProperties.length / itemsPerPage);
  const paginatedFeaturedProperties = featuredProperties.slice(
    (featuredCurrentPage - 1) * itemsPerPage,
    featuredCurrentPage * itemsPerPage
  );

  const totalFreePages = Math.ceil(freeProperties.length / itemsPerPage);
  const paginatedFreeProperties = freeProperties.slice(
    (freeCurrentPage - 1) * itemsPerPage,
    freeCurrentPage * itemsPerPage
  );

  const filteredLocations = LOCATIONS.filter(l => 
    l.toLowerCase().includes(filters.location.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Imóveis" 
        description="Encontre os melhores imóveis para comprar, vender ou arrendar em Moçambique." 
      />
      
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <Filter className="h-5 w-5" />
                Filtros
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              >
                {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
            
            {showFilters && (
              <div className="space-y-4">
                <div ref={locationWrapperRef} className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Localização</label>
                  <div className="relative">
                    <Input 
                      placeholder="Pesquisar cidade..."
                      value={filters.location}
                      onChange={(e) => {
                        setFilters({...filters, location: e.target.value});
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => setShowLocationSuggestions(true)}
                      className="pr-8"
                    />
                    {filters.location && (
                      <button 
                        onClick={() => setFilters({...filters, location: ''})}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {showLocationSuggestions && (filters.location.length > 0 || filteredLocations.length > 0) && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map(l => (
                          <div
                            key={l}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                            onClick={() => {
                              setFilters({...filters, location: l});
                              setShowLocationSuggestions(false);
                            }}
                          >
                            {l}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">Nenhuma localização encontrada</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Categoria</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                  >
                    <option value="">Todas</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Transação</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                  >
                    <option value="">Todos</option>
                    <option value="Venda">Venda</option>
                    <option value="Arrendamento">Arrendamento</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Quartos (Mín)</label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Área Mín (m²)</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={filters.minArea}
                    onChange={(e) => setFilters({...filters, minArea: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Preço Mín (MZN)</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  />
                </div>

                 <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Preço Máx (MZN)</label>
                  <Input 
                    type="number" 
                    placeholder="Sem limite" 
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2 text-brand-purple border-brand-purple hover:bg-brand-purple/10"
                  onClick={() => {
                    setFilters({
                      location: '', 
                      category: '', 
                      type: '', 
                      minPrice: '', 
                      maxPrice: '',
                      bedrooms: '',
                      minArea: ''
                    });
                    setSortOrder('newest');
                    setFeaturedCurrentPage(1);
                    setFreeCurrentPage(1);
                    setSearchParams({});
                  }}
                >
                  Limpar Filtros
                </Button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 border-brand-purple text-brand-purple hover:bg-brand-purple/10">
                        <Bell className="h-4 w-4" />
                        Criar Alerta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Receber alertas de novos imóveis</DialogTitle>
                        <DialogDescription>
                          Enviaremos um email quando novos imóveis corresponderem à sua pesquisa atual.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleNotifySubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium">Email</label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          <p className="font-medium text-gray-700 mb-2">Filtros ativos:</p>
                          <ul className="list-disc pl-4 space-y-1 text-gray-600">
                            {filters.location && <li>Localização: {filters.location}</li>}
                            {filters.category && <li>Categoria: {filters.category}</li>}
                            {filters.type && <li>Tipo: {filters.type}</li>}
                            {filters.minPrice && <li>Preço Mín: {filters.minPrice}</li>}
                            {filters.maxPrice && <li>Preço Máx: {filters.maxPrice}</li>}
                            {filters.bedrooms && <li>Quartos: {filters.bedrooms}+</li>}
                            {filters.minArea && <li>Área Mín: {filters.minArea} m²</li>}
                            {!filters.location && !filters.category && !filters.type && !filters.minPrice && !filters.maxPrice && !filters.bedrooms && !filters.minArea && (
                              <li>Todos os imóveis (sem filtros)</li>
                            )}
                          </ul>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
                            Ativar Notificações
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Imóveis Disponíveis</h1>
              <p className="text-gray-500">
                {filteredProperties.length} resultados encontrados
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <select
                  id="sort"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Mais Recentes</option>
                  <option value="oldest">Mais Antigos</option>
                  <option value="price_asc">Preço: Menor para Maior</option>
                  <option value="price_desc">Preço: Maior para Menor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {filteredProperties.length > 0 ? (
              <>
                {/* Featured Properties Section */}
                  {paginatedFeaturedProperties.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Star className="h-6 w-6 text-amber-500 fill-current" />
                        Imóveis em Destaque
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedFeaturedProperties.map(property => (
                          <PropertyCard key={property.id} property={property} />
                        ))}
                      </div>
                      
                      {/* Featured Pagination Controls */}
                      {totalFeaturedPages > 1 && (
                        <div className="mt-8 flex justify-center items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFeaturedCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={featuredCurrentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          {Array.from({ length: totalFeaturedPages }, (_, i) => i + 1).map(page => (
                            <Button
                              key={`feat-${page}`}
                              variant={featuredCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFeaturedCurrentPage(page)}
                              className={featuredCurrentPage === page ? "bg-brand-green hover:bg-brand-green-hover" : ""}
                            >
                              {page}
                            </Button>
                          ))}

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFeaturedCurrentPage(prev => Math.min(prev + 1, totalFeaturedPages))}
                            disabled={featuredCurrentPage === totalFeaturedPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Free Properties Section */}
                  {paginatedFreeProperties.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">
                        Imóveis Publicados Gratuitamente
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedFreeProperties.map(property => (
                          <PropertyCard key={property.id} property={property} />
                        ))}
                      </div>
                      
                      {/* Free Pagination Controls */}
                      {totalFreePages > 1 && (
                        <div className="mt-8 flex justify-center items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFreeCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={freeCurrentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          {Array.from({ length: totalFreePages }, (_, i) => i + 1).map(page => (
                            <Button
                              key={`free-${page}`}
                              variant={freeCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFreeCurrentPage(page)}
                              className={freeCurrentPage === page ? "bg-brand-green hover:bg-brand-green-hover" : ""}
                            >
                              {page}
                            </Button>
                          ))}

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setFreeCurrentPage(prev => Math.min(prev + 1, totalFreePages))}
                            disabled={freeCurrentPage === totalFreePages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ops! Nenhum imóvel encontrado</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Não encontrámos nenhum imóvel com os filtros selecionados. Tente remover alguns filtros ou procurar numa localização diferente.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilters({ location: '', category: '', type: '', minPrice: '', maxPrice: '', bedrooms: '', minArea: '' });
                      setSortOrder('newest');
                      setFeaturedCurrentPage(1);
                      setFreeCurrentPage(1);
                      setSearchParams({});
                    }}
                    className="text-brand-purple border-brand-purple hover:bg-brand-purple/10"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
