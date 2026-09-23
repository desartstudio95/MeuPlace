import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { Property, LOCATIONS, CATEGORIES } from '@/types';
import { PropertyCard, PropertyCardSkeleton } from '@/components/PropertyCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
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
import {
  Search,
  Filter,
  X,
  Bell,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  Home as HomeIcon,
  Tag
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import {
  PropertyFilters,
  searchParamsToFilters,
  filtersToSearchParams,
  executePropertySearch,
  DEFAULT_PAGE_SIZE
} from '@/services/propertyQueryService';
import { DocumentSnapshot } from 'firebase/firestore';

export function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { userProfile, loading: authLoading } = useAuth();

  // 1. Estado derivado da URL (Single Source of Truth)
  const currentFilters: PropertyFilters = searchParamsToFilters(searchParams);

  // Estados locais para inputs que necessitam de digitação contínua
  const [locationInput, setLocationInput] = useState(currentFilters.location || '');
  const [minPriceInput, setMinPriceInput] = useState(currentFilters.minPrice ? String(currentFilters.minPrice) : '');
  const [maxPriceInput, setMaxPriceInput] = useState(currentFilters.maxPrice ? String(currentFilters.maxPrice) : '');
  const [minAreaInput, setMinAreaInput] = useState(currentFilters.minArea ? String(currentFilters.minArea) : '');

  // Sincronizar inputs locais quando os parâmetros da URL mudarem externamente (ex: botão voltar)
  useEffect(() => {
    setLocationInput(currentFilters.location || '');
    setMinPriceInput(currentFilters.minPrice ? String(currentFilters.minPrice) : '');
    setMaxPriceInput(currentFilters.maxPrice ? String(currentFilters.maxPrice) : '');
    setMinAreaInput(currentFilters.minArea ? String(currentFilters.minArea) : '');
  }, [searchParams]);

  // Estados de dados e paginação
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pageParam = Number(searchParams.get('page'));
    return pageParam && pageParam > 0 ? pageParam : 1;
  });

  // Armazenamento de cursores por página para navegação reversa segura no Firestore
  const [cursorMap, setCursorMap] = useState<Map<number, DocumentSnapshot | null>>(new Map());

  // UI States
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showFiltersDesktop, setShowFiltersDesktop] = useState(true);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  // Alerta por email
  const [alertEmail, setAlertEmail] = useState('');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  // Executar busca no Firestore com base nos filtros da URL
  const runSearch = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const cursor = targetPage > 1 ? cursorMap.get(targetPage - 1) || null : null;
      const result = await executePropertySearch(currentFilters, {
        pageSize: DEFAULT_PAGE_SIZE,
        cursor
      });

      setProperties(result.properties);
      setHasMore(result.hasMore);

      if (result.lastDoc) {
        setCursorMap(prev => new Map(prev).set(targetPage, result.lastDoc));
      }
    } catch (err: any) {
      console.error('[Properties] Erro ao carregar imóveis:', err);
      setError('Ocorreu um erro ao carregar os imóveis do servidor. Por favor, tente novamente.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, cursorMap]);

  // Executa busca sempre que a URL ou página mudar
  useEffect(() => {
    runSearch(currentPage);
  }, [searchParams, currentPage]);

  // Atualizar URL com novos filtros
  const applyFilters = (newPartialFilters: Partial<PropertyFilters>, resetPage = true) => {
    const updatedFilters: PropertyFilters = {
      ...currentFilters,
      ...newPartialFilters
    };

    const newParams = filtersToSearchParams(updatedFilters);
    if (!resetPage && currentPage > 1) {
      newParams.set('page', String(currentPage));
    } else {
      setCurrentPage(1);
      setCursorMap(new Map());
    }

    setSearchParams(newParams, { replace: true });
  };

  // Remover um filtro específico
  const removeFilter = (key: keyof PropertyFilters) => {
    const updated = { ...currentFilters };
    delete updated[key];
    const newParams = filtersToSearchParams(updated);
    setCurrentPage(1);
    setCursorMap(new Map());
    setSearchParams(newParams, { replace: true });
  };

  // Limpar todos os filtros
  const resetAllFilters = () => {
    setLocationInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setMinAreaInput('');
    setCurrentPage(1);
    setCursorMap(new Map());
    setSearchParams({}, { replace: true });
  };

  // Navegar para próxima página
  const handleNextPage = () => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(nextPage));
    setSearchParams(newParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navegar para página anterior
  const handlePrevPage = () => {
    if (currentPage <= 1 || loading) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    const newParams = new URLSearchParams(searchParams);
    if (prevPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', String(prevPage));
    }
    setSearchParams(newParams, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Autocomplete de cidades
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

  const filteredLocations = LOCATIONS.filter(l =>
    l.toLowerCase().includes(locationInput.toLowerCase())
  );

  // Submissão de alerta
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail) return;

    addNotification({
      title: 'Alerta Ativado com Sucesso!',
      message: `Você receberá atualizações em ${alertEmail} quando surgirem imóveis com estes critérios.`,
      type: 'success'
    });

    setIsAlertDialogOpen(false);
    setAlertEmail('');
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (userProfile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Contagem de filtros ativos
  const activeFiltersCount = [
    currentFilters.type,
    currentFilters.category,
    currentFilters.location,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.currency,
    currentFilters.bedrooms,
    currentFilters.minArea,
    currentFilters.verifiedOnly
  ].filter(val => val !== undefined && val !== '' && val !== false).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <SEO 
        title="Imóveis em Moçambique | MeuPlace" 
        description="Pesquise apartamentos, moradias e terrenos para compra e arrendamento em Maputo, Matola, Beira e todo Moçambique." 
      />

      {/* Header com Navegação e Título */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)} 
              className="text-gray-500 hover:text-gray-900 -ml-2 px-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-wider">Catálogo Oficial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Imóveis Disponíveis
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Anúncios aprovados e verificados em todo o território moçambicano.
          </p>
        </div>

        {/* Botão de Filtro Mobile & Ordenação */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden flex items-center gap-1.5 border-gray-300"
          >
            <SlidersHorizontal className="h-4 w-4 text-brand-purple" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-brand-purple text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-xs font-medium text-gray-500 hidden sm:inline-block">
              Ordenar por:
            </label>
            <select
              id="sort"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 shadow-sm focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
              value={currentFilters.sort || 'newest'}
              onChange={(e) => applyFilters({ sort: e.target.value as any }, false)}
            >
              <option value="newest">Mais Recentes</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="area_desc">Maior Área</option>
              <option value="oldest">Mais Antigos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Rápidas de Tipo de Transação */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => applyFilters({ type: '' })}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            !currentFilters.type
              ? 'bg-brand-purple text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos os Tipos
        </button>
        <button
          onClick={() => applyFilters({ type: 'Venda' })}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentFilters.type === 'Venda'
              ? 'bg-brand-purple text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Para Comprar (Venda)
        </button>
        <button
          onClick={() => applyFilters({ type: 'Arrendamento' })}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            currentFilters.type === 'Arrendamento'
              ? 'bg-brand-purple text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Para Arrendar
        </button>

        <button
          onClick={() => applyFilters({ verifiedOnly: !currentFilters.verifiedOnly })}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            currentFilters.verifiedOnly
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ShieldCheck className={`h-3.5 w-3.5 ${currentFilters.verifiedOnly ? 'text-emerald-600 fill-emerald-100' : 'text-gray-400'}`} />
          Apenas Verificados
        </button>
      </div>

      {/* Chips / Pills de Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 text-gray-400" />
            Filtros Ativos:
          </span>

          {currentFilters.type && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              Tipo: {currentFilters.type}
              <button onClick={() => removeFilter('type')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.category && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              {currentFilters.category}
              <button onClick={() => removeFilter('category')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.location && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              {currentFilters.location}
              <button onClick={() => removeFilter('location')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.minPrice && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              Min: {Number(currentFilters.minPrice).toLocaleString()} {currentFilters.currency || 'MZN'}
              <button onClick={() => removeFilter('minPrice')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.maxPrice && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              Max: {Number(currentFilters.maxPrice).toLocaleString()} {currentFilters.currency || 'MZN'}
              <button onClick={() => removeFilter('maxPrice')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.bedrooms && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              {currentFilters.bedrooms}+ Quartos
              <button onClick={() => removeFilter('bedrooms')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.minArea && (
            <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-800 border border-gray-200 shadow-2xs">
              ≥ {currentFilters.minArea} m²
              <button onClick={() => removeFilter('minArea')} className="text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.verifiedOnly && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-800 border border-emerald-200 shadow-2xs">
              Verificados
              <button onClick={() => removeFilter('verifiedOnly')} className="text-emerald-500 hover:text-emerald-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetAllFilters}
            className="text-xs font-medium text-brand-purple hover:underline ml-auto"
          >
            Limpar Todos
          </button>
        </div>
      )}

      {/* Grid Principal: Sidebar de Filtros + Resultados */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Painel Lateral de Filtros (Desktop & Mobile Drawer) */}
        <aside
          className={`w-full md:w-68 lg:w-72 shrink-0 bg-white p-5 rounded-xl border border-gray-200 shadow-xs ${
            showFiltersMobile ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Filter className="h-4 w-4 text-brand-purple" />
              Refinar Pesquisa
            </div>
            <button
              onClick={() => setShowFiltersDesktop(!showFiltersDesktop)}
              className="text-gray-400 hover:text-gray-600 hidden md:block"
            >
              {showFiltersDesktop ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {(showFiltersDesktop || showFiltersMobile) && (
            <div className="space-y-4">
              
              {/* Localização com Autocomplete */}
              <div ref={locationWrapperRef} className="relative">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Localização / Cidade</label>
                <div className="relative">
                  <Input 
                    placeholder="Ex: Maputo, Matola, Beira..."
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters({ location: locationInput.trim() });
                        setShowLocationSuggestions(false);
                      }
                    }}
                    className="text-xs pr-8"
                  />
                  {locationInput ? (
                    <button 
                      onClick={() => {
                        setLocationInput('');
                        applyFilters({ location: '' });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <Search className="h-3.5 w-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>

                {showLocationSuggestions && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-52 overflow-y-auto">
                    <div
                      className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs font-medium text-brand-purple border-b border-gray-100"
                      onClick={() => {
                        setLocationInput('');
                        applyFilters({ location: '' });
                        setShowLocationSuggestions(false);
                      }}
                    >
                      Todas as Cidades
                    </div>
                    {filteredLocations.map(l => (
                      <div
                        key={l}
                        className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-gray-700"
                        onClick={() => {
                          setLocationInput(l);
                          applyFilters({ location: l });
                          setShowLocationSuggestions(false);
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Categoria de Imóvel</label>
                <select 
                  className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-purple focus:outline-none"
                  value={currentFilters.category || ''}
                  onChange={(e) => applyFilters({ category: e.target.value })}
                >
                  <option value="">Todas as Categorias</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Moeda */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Moeda</label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-md text-xs">
                  <button
                    onClick={() => applyFilters({ currency: '' })}
                    className={`py-1 text-center font-medium rounded ${
                      !currentFilters.currency ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => applyFilters({ currency: 'MZN' })}
                    className={`py-1 text-center font-medium rounded ${
                      currentFilters.currency === 'MZN' ? 'bg-white shadow-2xs text-brand-purple font-bold' : 'text-gray-600'
                    }`}
                  >
                    MZN
                  </button>
                  <button
                    onClick={() => applyFilters({ currency: 'USD' })}
                    className={`py-1 text-center font-medium rounded ${
                      currentFilters.currency === 'USD' ? 'bg-white shadow-2xs text-brand-purple font-bold' : 'text-gray-600'
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>

              {/* Faixa de Preço */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Faixa de Preço ({currentFilters.currency || 'MZN'})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="number" 
                    placeholder="Mínimo" 
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    onBlur={() => {
                      const num = minPriceInput ? Number(minPriceInput) : undefined;
                      applyFilters({ minPrice: num });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = minPriceInput ? Number(minPriceInput) : undefined;
                        applyFilters({ minPrice: num });
                      }
                    }}
                    className="text-xs"
                  />
                  <Input 
                    type="number" 
                    placeholder="Máximo" 
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    onBlur={() => {
                      const num = maxPriceInput ? Number(maxPriceInput) : undefined;
                      applyFilters({ maxPrice: num });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = maxPriceInput ? Number(maxPriceInput) : undefined;
                        applyFilters({ maxPrice: num });
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Quartos (Mínimo) */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Quartos Mínimos</label>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {['', '1', '2', '3', '4'].map(q => {
                    const isSelected = q === '' ? !currentFilters.bedrooms : currentFilters.bedrooms === Number(q);
                    return (
                      <button
                        key={q || 'any'}
                        onClick={() => applyFilters({ bedrooms: q ? Number(q) : undefined })}
                        className={`py-1.5 rounded border text-center font-medium transition-colors ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {q ? `${q}+` : 'Todos'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área Mínima */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Área Mínima (m²)</label>
                <Input 
                  type="number" 
                  placeholder="Ex: 80" 
                  value={minAreaInput}
                  onChange={(e) => setMinAreaInput(e.target.value)}
                  onBlur={() => {
                    const num = minAreaInput ? Number(minAreaInput) : undefined;
                    applyFilters({ minArea: num });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const num = minAreaInput ? Number(minAreaInput) : undefined;
                      applyFilters({ minArea: num });
                    }
                  }}
                  className="text-xs"
                />
              </div>

              {/* Ações da Sidebar */}
              <div className="pt-2 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                  onClick={resetAllFilters}
                >
                  Limpar Todos os Filtros
                </Button>

                {/* Dialog de Alerta de Pesquisa */}
                <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs gap-1.5 border-brand-purple/40 text-brand-purple hover:bg-brand-purple/5"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Criar Alerta desta Busca
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Ativar Alertas de Novos Imóveis</DialogTitle>
                      <DialogDescription className="text-xs text-gray-500">
                        Receba uma notificação por email quando novos imóveis correspondentes a estes filtros forem adicionados.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAlert} className="space-y-4 py-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Seu Email</label>
                        <Input 
                          type="email" 
                          placeholder="exemplo@email.com" 
                          required
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-600 space-y-1">
                        <div className="font-semibold text-gray-800">Critérios salvos:</div>
                        <div>• Tipo: {currentFilters.type || 'Qualquer'}</div>
                        <div>• Categoria: {currentFilters.category || 'Todas'}</div>
                        <div>• Localização: {currentFilters.location || 'Moçambique inteiro'}</div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-sm">
                          Confirmar Alerta
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

            </div>
          )}
        </aside>

        {/* Área de Resultados */}
        <main className="flex-1 w-full min-w-0">
          
          {/* Header com Status da Busca */}
          <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
            <div>
              {loading ? (
                <span>A consultar base de dados do Firestore...</span>
              ) : (
                <span>
                  A mostrar <strong className="text-gray-900">{properties.length}</strong> {properties.length === 1 ? 'imóvel' : 'imóveis'} nesta página
                </span>
              )}
            </div>
            {currentPage > 1 && (
              <span className="font-medium text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">
                Página {currentPage}
              </span>
            )}
          </div>

          {/* Estado de Carregamento (Skeleton Shimmer) */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Estado de Erro */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-800 font-medium mb-3">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runSearch(currentPage)} 
                className="gap-1.5 text-xs text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Grid de Imóveis Reais */}
          {!loading && !error && properties.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {properties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Controles de Paginação com Cursor do Firestore */}
              <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1 || loading}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Página Anterior
                </Button>

                <div className="text-xs text-gray-500 font-medium">
                  Página {currentPage}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  className="gap-1 text-xs bg-brand-purple text-white hover:bg-brand-purple/90 hover:text-white border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Próxima Página
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Estado Vazio (Nenhum Imóvel Encontrado) */}
          {!loading && !error && properties.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center">
              <div className="bg-purple-50 p-4 rounded-full mb-4">
                <Search className="h-10 w-10 text-brand-purple" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Nenhum imóvel encontrado
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-5">
                Não encontramos imóveis aprovados com os filtros atuais. Tente expandir a faixa de preço ou selecionar outra cidade.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetAllFilters}
                className="text-xs font-semibold text-brand-purple border-brand-purple hover:bg-brand-purple/10"
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
