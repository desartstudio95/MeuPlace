import React from 'react';
import { LeadStatus, LeadPriority, LEAD_STATUS_VOCABULARY } from '@/types';
import { LEAD_STATUS_CONFIG } from './LeadStatusBadge';
import { LEAD_PRIORITY_CONFIG } from './LeadPriorityBadge';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, Info } from 'lucide-react';

export type LeadScope = 'assigned' | 'owner' | 'all';

interface LeadFilterBarProps {
  currentScope: LeadScope;
  onScopeChange: (scope: LeadScope) => void;
  canViewAll: boolean; // Only for admin
  selectedStatus: LeadStatus | 'all';
  onStatusChange: (status: LeadStatus | 'all') => void;
  selectedPriority: LeadPriority | 'all';
  onPriorityChange: (priority: LeadPriority | 'all') => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  onResetFilters: () => void;
  totalLoaded: number;
}

export function LeadFilterBar({
  currentScope,
  onScopeChange,
  canViewAll,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  searchTerm,
  onSearchChange,
  onResetFilters,
  totalLoaded
}: LeadFilterBarProps) {
  const hasActiveFilters = selectedStatus !== 'all' || selectedPriority !== 'all' || searchTerm.length > 0;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-4">
      {/* Linha Superior: Escopo e Pesquisa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Seletor de Escopo / Custódia */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => onScopeChange('assigned')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentScope === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Todos os Leads (Admin)
            </button>
          )}
        </div>

        {/* Campo de Pesquisa nos Carregados */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Pesquisar nos leads por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-gray-50 border-gray-200"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Linha Inferior: Filtros Indexados (Status e Prioridade) */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrar por:</span>
        </div>

        {/* Filtro de Status */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-status" className="text-xs text-gray-500">Status:</label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => {
              onStatusChange(e.target.value as LeadStatus | 'all');
            }}
            className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="all">Todos os Status</option>
            {LEAD_STATUS_VOCABULARY.map((st) => (
              <option key={st} value={st}>
                {LEAD_STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Prioridade */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-priority" className="text-xs text-gray-500">Prioridade:</label>
          <select
            id="filter-priority"
            value={selectedPriority}
            onChange={(e) => {
              onPriorityChange(e.target.value as LeadPriority | 'all');
            }}
            className="text-xs font-medium h-8 px-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-green"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="high">Alta (Urgente)</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Limpar Filtros
          </button>
        )}
      </div>

      {/* Nota de Arquitetura & Índices Comportados */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50/70 px-3 py-1.5 rounded-md border border-gray-100">
        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>
          Consultas otimizadas com índices compostos ativos no Firestore. Exibindo {totalLoaded} lead(s) carregados nesta página.
        </span>
      </div>
    </div>
  );
}
