import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Property, LOCATIONS, CATEGORIES } from '@/types';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, X, Bell, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Map as MapIcon, List } from 'lucide-react';
import { PROPERTIES as MOCK_PROPERTIES } from '@/data/mockData';

export function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [highlightedPropertyId, setHighlightedPropertyId] = useState<string | undefined>();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
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
        link: `/properties/${MOCK_PROPERTIES[0].id}` // Just linking to the first one for demo
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
    setCurrentPage(1); // Reset to first page on filter change
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

  const handleMarkerClick = (propertyId: string) => {
    setHighlightedPropertyId(propertyId);
    
    // Find which page the property is on
    const propertyIndex = filteredProperties.findIndex(p => p.id === propertyId);
    if (propertyIndex !== -1) {
      const page = Math.floor(propertyIndex / itemsPerPage) + 1;
      if (page !== currentPage) {
        setCurrentPage(page);
      }
      
      // Scroll to the card after a short delay to allow rendering
      setTimeout(() => {
        const cardElement = document.getElementById(`property-card-${propertyId}`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const filteredProperties = MOCK_PROPERTIES.filter(p => {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredLocations = LOCATIONS.filter(l => 
    l.toLowerCase().includes(filters.location.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className="w-full mt-2"
                  onClick={() => setFilters({
                    location: '', 
                    category: '', 
                    type: '', 
                    minPrice: '', 
                    maxPrice: '',
                    bedrooms: '',
                    minArea: ''
                  })}
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
                Mostrando {paginatedProperties.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredProperties.length)} de {filteredProperties.length} resultados
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 px-3 ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 px-3 ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  onClick={() => setViewMode('map')}
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Mapa
                </Button>
              </div>

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

          {viewMode === 'map' ? (
            <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
              <div className="w-full lg:w-1/2 overflow-y-auto pr-2 pb-4 space-y-6">
                {paginatedProperties.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {paginatedProperties.map(property => (
                        <PropertyCard 
                          key={property.id} 
                          property={property} 
                          isHighlighted={property.id === highlightedPropertyId} 
                        />
                      ))}
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-brand-green hover:bg-brand-green-hover" : ""}
                          >
                            {page}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                    <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum imóvel encontrado</h3>
                    <p className="text-gray-500">Tente ajustar os seus filtros de pesquisa.</p>
                  </div>
                )}
              </div>
              <div className="w-full lg:w-1/2 h-[400px] lg:h-full sticky top-4">
                <PropertyMap 
                  properties={filteredProperties} 
                  height="100%" 
                  onMarkerClick={handleMarkerClick}
                  highlightedPropertyId={highlightedPropertyId}
                />
              </div>
            </div>
          ) : (
            <>
              {paginatedProperties.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedProperties.map(property => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-brand-green hover:bg-brand-green-hover" : ""}
                        >
                          {page}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum imóvel encontrado</h3>
                  <p className="text-gray-500">Tente ajustar os seus filtros de pesquisa.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
