import React from 'react';
import { 
  CrmDatePreset, 
  formatDateMozambique 
} from '@/utils/crmDateUtils';
import { LeadStatus, LeadPriority, LeadSource } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Filter, 
  X, 
  RefreshCw, 
  Building2, 
  Users, 
  Layers, 
  Flame, 
  ArrowUpDown
} from 'lucide-react';

interface CrmDashboardFiltersProps {
  currentScope: 'assigned' | 'owner' | 'all';
  onScopeChange: (scope: 'assigned' | 'owner' | 'all') => void;
  canViewAll: boolean; // apenas admin
  datePreset: CrmDatePreset;
  onDatePresetChange: (preset: CrmDatePreset) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange: (start: string, end: string) => void;
  periodLabel: string;
  selectedStatus: LeadStatus | 'all';
  onStatusChange: (status: LeadStatus | 'all') => void;
  selectedPriority: LeadPriority | 'all';
  onPriorityChange: (priority: LeadPriority | 'all') => void;
  selectedSource: LeadSource | 'all';
  onSourceChange: (source: LeadSource | 'all') => void;
  selectedPropertyId: string | 'all';
  onPropertyChange: (propertyId: string | 'all') => void;
  selectedAgentId: string | 'all';
  onAgentChange: (agentId: string | 'all') => void;
  availableProperties: { id: string; title: string }[];
  availableAgents: { id: string; name: string }[];
  onResetFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function CrmDashboardFilters({
  currentScope,
  onScopeChange,
  canViewAll,
  datePreset,
  onDatePresetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  periodLabel,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  selectedSource,
  onSourceChange,
  selectedPropertyId,
  onPropertyChange,
  selectedAgentId,
  onAgentChange,
  availableProperties,
  availableAgents,
  onResetFilters,
  onRefresh,
  loading
}: CrmDashboardFiltersProps) {
  const hasActiveSecondaryFilters =
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    selectedSource !== 'all' ||
    selectedPropertyId !== 'all' ||
    selectedAgentId !== 'all';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
      {/* Linha 1: Seletor de Escopo (Custódia) e Ação de Atualizar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Scope Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => onScopeChange('assigned')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentScope === 'assigned'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Atribuídos a Mim
          </button>
          <button
            type="button"
            onClick={() => onScopeChange('owner')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentScope === 'owner'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Meus Imóveis (Proprietário)
          </button>
          {canViewAll && (
            <button
              type="button"
              onClick={() => onScopeChange('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                currentScope === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Toda a Operação (Admin)
            </button>
          )}
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-medium text-gray-400 hidden sm:inline-flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Período:
          </span>
          {(['7d', '30d', '90d', 'all', 'custom'] as CrmDatePreset[]).map((p) => {
            const labelMap: Record<CrmDatePreset, string> = {
              '7d': '7 dias',
              '30d': '30 dias',
              '90d': '90 dias',
              'all': 'Histórico',
              'custom': 'Custom'
            };
            const isActive = datePreset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onDatePresetChange(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-green/10 text-brand-green border-brand-green/30 font-semibold'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {labelMap[p]}
              </button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-1.5 text-xs h-8 ml-2 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-green' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">Recarregar</span>
          </Button>
        </div>
      </div>

      {/* Date Range Custom Input (se selecionado 'custom') */}
      {datePreset === 'custom' && (
        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-emerald-800">Intervalo Personalizado:</span>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-start" className="text-gray-600">De:</label>
            <input
              id="custom-start"
              type="date"
              value={customStartDate || ''}
              onChange={(e) => onCustomDateChange(e.target.value, customEndDate || '')}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-end" className="text-gray-600">Até:</label>
            <input
              id="custom-end"
              type="date"
              value={customEndDate || ''}
              onChange={(e) => onCustomDateChange(customStartDate || '', e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-800"
            />
          </div>
          <span className="text-[11px] text-gray-500 ml-auto">
            Limites inclusivos no fuso de Moçambique (UTC+2)
          </span>
        </div>
      )}

      {/* Linha 2: Filtros Secundários (Status, Prioridade, Imóvel, Origem, Agente) */}
      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros:</span>
        </div>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus | 'all')}
          className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="all">Todos os Status</option>
          <option value="new">Novo (Entrada)</option>
          <option value="contacted">Contactado</option>
          <option value="qualified">Qualificado</option>
          <option value="negotiating">Em Negociação</option>
          <option value="won">Ganho (Fechado)</option>
          <option value="lost">Perdido</option>
          <option value="archived">Arquivado</option>
        </select>

        {/* Prioridade */}
        <select
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value as LeadPriority | 'all')}
          className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="all">Todas as Prioridades</option>
          <option value="high">Alta (Urgente)</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>

        {/* Origem */}
        <select
          value={selectedSource}
          onChange={(e) => onSourceChange(e.target.value as LeadSource | 'all')}
          className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green"
        >
          <option value="all">Todas as Origens</option>
          <option value="whatsapp">WhatsApp Directo</option>
          <option value="contact_form">Formulário de Contacto</option>
          <option value="phone">Ligação Telefónica</option>
          <option value="viewing_request">Pedido de Visita</option>
        </select>

        {/* Imóvel */}
        {availableProperties.length > 0 && (
          <select
            value={selectedPropertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green max-w-[200px] truncate"
          >
            <option value="all">Todos os Imóveis ({availableProperties.length})</option>
            {availableProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}

        {/* Agente (quando aplicável: admin ou múltiplos agentes) */}
        {canViewAll && availableAgents.length > 0 && (
          <select
            value={selectedAgentId}
            onChange={(e) => onAgentChange(e.target.value)}
            className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green max-w-[180px] truncate"
          >
            <option value="all">Todos os Agentes</option>
            {availableAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        {/* Botão Limpar Filtros */}
        {hasActiveSecondaryFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Limpar Filtros
          </button>
        )}

        <div className="ml-auto text-[11px] text-gray-400 font-medium hidden md:block">
          Período: <span className="text-gray-700 font-semibold">{periodLabel}</span>
        </div>
      </div>
    </div>
  );
}
