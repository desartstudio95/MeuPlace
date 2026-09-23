import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  crmQueryService, 
  CrmLeadFilter 
} from '@/services/crmQueryService';
import { Lead, LeadStatus, LeadPriority } from '@/types';
import { DocumentSnapshot } from 'firebase/firestore';
import { LeadStatusBadge } from '@/components/crm/LeadStatusBadge';
import { LeadPriorityBadge } from '@/components/crm/LeadPriorityBadge';
import { LeadFilterBar, LeadScope } from '@/components/crm/LeadFilterBar';
import { LeadTasksQueueTab } from '@/components/crm/LeadTasksQueueTab';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  RefreshCw, 
  Phone, 
  Mail, 
  ArrowRight, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  ExternalLink,
  MessageCircle,
  Clock,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';

export function CrmLeadsInbox() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Tab Principal: 'leads' ou 'tasks'
  const [activeTab, setActiveTab] = useState<'leads' | 'tasks'>('leads');

  // Escopo e Filtros
  const [scope, setScope] = useState<LeadScope>('assigned');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Dados e Paginação
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userProfile?.role === 'admin';

  // Montagem do filtro com isolamento e índices garantidos
  const buildFilter = useCallback((): CrmLeadFilter => {
    const filter: CrmLeadFilter = {};

    if (scope === 'assigned' && currentUser) {
      filter.agentId = currentUser.uid;
    } else if (scope === 'owner' && currentUser) {
      filter.propertyOwnerId = currentUser.uid;
    } else if (scope === 'all') {
      // Permitido apenas para admin; não adiciona restrição de agente
    } else if (currentUser) {
      filter.agentId = currentUser.uid;
    }

    if (statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    if (priorityFilter !== 'all') {
      filter.priority = priorityFilter;
    }

    return filter;
  }, [scope, statusFilter, priorityFilter, currentUser]);

  // Busca inicial / re-fetch
  const fetchLeads = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    try {
      const filter = buildFilter();
      const result = await crmQueryService.getLeadsFiltered(filter, { limitCount: 20 });
      setLeads(result.leads);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error('[CrmLeadsInbox] Erro ao carregar leads:', err);
      setError('Não foi possível carregar os leads da sua carteira. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, buildFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Carregar mais (Cursor Pagination)
  const handleLoadMore = async () => {
    if (!lastDoc || !hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const filter = buildFilter();
      const result = await crmQueryService.getLeadsFiltered(filter, { 
        limitCount: 20, 
        lastDoc 
      });

      setLeads(prev => [...prev, ...result.leads]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error('[CrmLeadsInbox] Erro ao paginar leads:', err);
      toast.error('Erro ao carregar mais registros.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Filtragem local pelo campo de pesquisa
  const filteredLeads = leads.filter(lead => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (lead.customerName || '').toLowerCase().includes(term);
    const phoneMatch = (lead.customerPhone || '').includes(term);
    const titleMatch = (lead.propertyTitle || '').toLowerCase().includes(term);
    return nameMatch || phoneMatch || titleMatch;
  });

  // Métricas rápidas dos leads carregados
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    negotiating: leads.filter(l => l.status === 'negotiating').length,
    won: leads.filter(l => l.status === 'won').length
  };

  return (
    <div className="min-h-screen bg-gray-50/70 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Inbox de Leads — CRM MeuPlace
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Gerenciamento comercial, atendimento ao cliente e acompanhamento de oportunidades imobiliárias.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLeads}
                disabled={loading}
                className="gap-2 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs">
                  Painel de Controlo
                </Button>
              </Link>
            </div>
          </div>

          {/* Cards de Métricas Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Total Carregados
              </span>
              <span className="text-xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                Novos (Não Atendidos)
              </span>
              <span className="text-xl font-bold text-blue-700">{stats.new}</span>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                Em Negociação
              </span>
              <span className="text-xl font-bold text-amber-700">{stats.negotiating}</span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Ganhos / Convertidos
              </span>
              <span className="text-xl font-bold text-emerald-700">{stats.won}</span>
            </div>
          </div>

          {/* Abas de Produtividade CRM */}
          <div className="flex items-center gap-2 border-b border-gray-200 mt-6 -mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'leads'
                  ? 'border-brand-green text-brand-green font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Inbox de Leads ({leads.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'tasks'
                  ? 'border-brand-green text-brand-green font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Fila de Follow-up Pessoal
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'tasks' ? (
          <LeadTasksQueueTab userId={currentUser?.uid || ''} />
        ) : (
          <>
            {/* Barra de Filtros */}
            <LeadFilterBar
          currentScope={scope}
          onScopeChange={(s) => {
            setScope(s);
          }}
          canViewAll={isAdmin}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedPriority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onResetFilters={() => {
            setStatusFilter('all');
            setPriorityFilter('all');
            setSearchTerm('');
          }}
          totalLoaded={filteredLeads.length}
        />

        {/* Estado de Erro */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Erro ao acessar os dados do CRM</p>
              <p className="mt-0.5 text-xs text-rose-700">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLeads}
              className="text-xs bg-white text-rose-800 border-rose-300 hover:bg-rose-50"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Estado de Carregamento Inicial (Skeletons) */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {!loading && filteredLeads.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Nenhum lead encontrado</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Não há leads correspondentes aos filtros de visualização selecionados. Você pode alterar o escopo ou limpar os filtros.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSearchTerm('');
              }}
              className="text-xs"
            >
              Redefinir Filtros
            </Button>
          </div>
        )}

        {/* Tabela de Leads (Desktop) */}
        {!loading && filteredLeads.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Cliente / Contacto</th>
                    <th scope="col" className="px-6 py-3.5">Imóvel de Interesse</th>
                    <th scope="col" className="px-6 py-3.5">Estado Comercial</th>
                    <th scope="col" className="px-6 py-3.5">Prioridade</th>
                    <th scope="col" className="px-6 py-3.5">Custódia / Responsável</th>
                    <th scope="col" className="px-6 py-3.5">Entrada</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredLeads.map((lead) => {
                    const rawPhone = (lead.customerPhone || '').replace(/\D/g, '');
                    const waLink = rawPhone ? `https://wa.me/${rawPhone}` : null;

                    return (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                      >
                        {/* Cliente */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 group-hover:text-brand-green transition-colors">
                            {lead.customerName}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1 font-mono text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {lead.customerPhone}
                            </span>
                            {lead.customerEmail && (
                              <span className="flex items-center gap-1 truncate max-w-[140px]" title={lead.customerEmail}>
                                <Mail className="w-3 h-3 text-gray-400" />
                                {lead.customerEmail}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Imóvel */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-800 line-clamp-1 max-w-[220px]">
                            {lead.propertyTitle || 'Imóvel sem título'}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            ID: {lead.propertyId.slice(0, 8)}...
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <LeadStatusBadge status={lead.status} size="md" />
                        </td>

                        {/* Prioridade */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <LeadPriorityBadge priority={lead.priority} size="md" />
                        </td>

                        {/* Custódia */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {lead.agentId ? (
                            <span className="font-mono text-gray-700 font-medium">
                              {lead.agentId === currentUser?.uid ? 'Você (Atribuído)' : `${lead.agentId.slice(0, 10)}...`}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Proprietário</span>
                          )}
                        </td>

                        {/* Entrada */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {lead.createdAt?.toDate ? (
                              new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short' }).format(lead.createdAt.toDate())
                            ) : (
                              'Recente'
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir WhatsApp"
                                className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <Link to={`/crm/leads/${lead.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs font-semibold text-brand-green hover:text-emerald-700 hover:bg-emerald-50">
                                Ver Lead <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visualização em Cartões (Mobile / Tablet) */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filteredLeads.map((lead) => {
                const rawPhone = (lead.customerPhone || '').replace(/\D/g, '');
                const waLink = rawPhone ? `https://wa.me/${rawPhone}` : null;

                return (
                  <div 
                    key={lead.id} 
                    className="p-4 space-y-3 hover:bg-gray-50/80 transition-colors"
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{lead.customerName}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{lead.propertyTitle}</p>
                      </div>
                      <LeadStatusBadge status={lead.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {lead.customerPhone}
                      </div>
                      <LeadPriorityBadge priority={lead.priority} size="sm" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {lead.agentId ? 'Atribuído' : 'Custódia Proprietário'}
                      </span>
                      <div className="flex items-center gap-2">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 text-xs"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <Link to={`/crm/leads/${lead.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs font-medium">
                            Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paginação por Cursor */}
        {!loading && hasMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs font-semibold px-6 py-2 bg-white shadow-2xs hover:bg-gray-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Carregando mais leads...
                </span>
              ) : (
                'Carregar Mais Leads'
              )}
            </Button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
