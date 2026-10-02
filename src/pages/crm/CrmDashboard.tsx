import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  crmAnalyticsService, 
  CrmAnalyticsFilter, 
  CrmAnalyticsResult 
} from '@/services/crmAnalyticsService';
import { CrmDatePreset } from '@/utils/crmDateUtils';
import { LeadStatus, LeadPriority, LeadSource } from '@/types';
import { CrmDashboardFilters } from '@/components/crm/dashboard/CrmDashboardFilters';
import { CrmKpiCards } from '@/components/crm/dashboard/CrmKpiCards';
import { CrmSalesFunnel } from '@/components/crm/dashboard/CrmSalesFunnel';
import { CrmLeadTrendChart } from '@/components/crm/dashboard/CrmLeadTrendChart';
import { CrmLeadSourcesChart } from '@/components/crm/dashboard/CrmLeadSourcesChart';
import { CrmPropertyPerformanceTable } from '@/components/crm/dashboard/CrmPropertyPerformanceTable';
import { CrmAgentPerformanceTable } from '@/components/crm/dashboard/CrmAgentPerformanceTable';
import { CrmRecentActivitiesFeed } from '@/components/crm/dashboard/CrmRecentActivitiesFeed';
import { CrmAttentionQueueWidget } from '@/components/crm/dashboard/CrmAttentionQueueWidget';
import { CrmSlaProductivityWidget } from '@/components/crm/dashboard/CrmSlaProductivityWidget';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Users, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export function CrmDashboard() {
  const { currentUser, userProfile } = useAuth();

  // Estados dos Filtros
  const [scope, setScope] = useState<'assigned' | 'owner' | 'all'>('assigned');
  const [datePreset, setDatePreset] = useState<CrmDatePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
  const [propertyIdFilter, setPropertyIdFilter] = useState<string | 'all'>('all');
  const [agentIdFilter, setAgentIdFilter] = useState<string | 'all'>('all');

  // Estados de Dados
  const [analytics, setAnalytics] = useState<CrmAnalyticsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userProfile?.role === 'admin';

  // Carregamento de Analytics
  const loadAnalytics = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    try {
      const filter: CrmAnalyticsFilter = {
        userId: currentUser.uid,
        userRole: userProfile?.role || 'agent',
        scope,
        datePreset,
        startDate: datePreset === 'custom' ? customStartDate : undefined,
        endDate: datePreset === 'custom' ? customEndDate : undefined,
        status: statusFilter,
        priority: priorityFilter,
        source: sourceFilter,
        propertyId: propertyIdFilter,
        agentId: agentIdFilter
      };

      const result = await crmAnalyticsService.getDashboardAnalytics(filter);
      setAnalytics(result);
    } catch (err: any) {
      console.error('[CrmDashboard] Erro ao carregar analytics comercial:', err);
      setError('Não foi possível carregar as métricas comerciais. Verifique a sua conexão e tente novamente.');
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, [
    currentUser,
    userProfile,
    scope,
    datePreset,
    customStartDate,
    customEndDate,
    statusFilter,
    priorityFilter,
    sourceFilter,
    propertyIdFilter,
    agentIdFilter
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSourceFilter('all');
    setPropertyIdFilter('all');
    setAgentIdFilter('all');
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    CRM Dashboard & Sales Analytics V1
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Métricas reais do pipeline comercial, conversões, follow-ups e visitas imobiliárias.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/crm/leads">
                <Button variant="outline" size="sm" className="gap-2 text-xs h-9 border-gray-200">
                  <Users className="w-3.5 h-3.5 text-brand-green" />
                  Inbox de Leads
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs h-9 text-gray-600">
                  Painel Geral
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Barra de Filtros e Escopo */}
        <CrmDashboardFilters
          currentScope={scope}
          onScopeChange={setScope}
          canViewAll={isAdmin}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          periodLabel={analytics?.period.label || 'Últimos 30 Dias'}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedPriority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          selectedSource={sourceFilter}
          onSourceChange={setSourceFilter}
          selectedPropertyId={propertyIdFilter}
          onPropertyChange={setPropertyIdFilter}
          selectedAgentId={agentIdFilter}
          onAgentChange={setAgentIdFilter}
          availableProperties={analytics?.availableProperties || []}
          availableAgents={analytics?.availableAgents || []}
          onResetFilters={handleResetFilters}
          onRefresh={loadAnalytics}
          loading={loading}
        />

        {/* Feedback de Erro */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              className="text-xs h-7 border-rose-200 text-rose-700 hover:bg-rose-100"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Skeleton de Carregamento Inicial */}
        {loading && !analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-gray-200/60" />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-2xl bg-gray-200/60" />
            <Skeleton className="h-80 w-full rounded-2xl bg-gray-200/60" />
          </div>
        )}

        {/* Conteúdo do Dashboard quando carregado */}
        {analytics && (
          <>
            {/* KPI Cards Principais & Operacionais */}
            <CrmKpiCards kpis={analytics.kpis} />

            {/* Fila de Atenção Imediata (Fase 5.5 CRM Intelligence) */}
            <CrmAttentionQueueWidget queue={analytics.attentionQueue} />

            {/* Métricas de SLA e Produtividade Comercial (Fase 5.5) */}
            <CrmSlaProductivityWidget 
              sla={analytics.slaMetrics} 
              productivity={analytics.salesProductivity} 
            />

            {/* Funil de Vendas Comercial */}
            <CrmSalesFunnel
              stages={analytics.funnel.stages}
              lostCount={analytics.funnel.lostCount}
              lostRate={analytics.funnel.lostRate}
              archivedCount={analytics.funnel.archivedCount}
              archivedRate={analytics.funnel.archivedRate}
            />

            {/* Gráfico de Tendência (Série Temporal) */}
            <CrmLeadTrendChart
              data={analytics.trend}
              periodLabel={analytics.period.label}
            />

            {/* Distribuição por Origem e Atividades Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CrmLeadSourcesChart
                sources={analytics.sources}
                totalLeads={analytics.kpis.leads.total}
              />
              <CrmRecentActivitiesFeed
                activities={analytics.recentActivities}
              />
            </div>

            {/* Desempenho por Imóvel */}
            <CrmPropertyPerformanceTable
              properties={analytics.propertyPerformance}
            />

            {/* Desempenho Operacional por Agente (visível para Admin ou quando há múltiplos agentes) */}
            {(isAdmin || analytics.agentPerformance.length > 1) && (
              <CrmAgentPerformanceTable
                agents={analytics.agentPerformance}
              />
            )}

            {/* Rodapé Informativo de Integridade */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-white rounded-xl border border-gray-200/70 text-[11px] text-gray-400">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-brand-green" />
                <span>
                  Sales Analytics V1 em conformidade com RBAC e isolamento multi-tenant do MeuPlace.
                </span>
              </div>
              <span className="font-mono text-[10px]">
                Fuso Horário: CAT (UTC+2 Moçambique)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
