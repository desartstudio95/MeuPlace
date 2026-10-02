import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AttentionQueueItem } from '@/services/crmAnalyticsService';
import { LeadScoreBadge } from '@/components/crm/LeadScoreBadge';
import { LeadHealthBadge } from '@/components/crm/LeadHealthBadge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  PhoneCall, 
  Flame, 
  AlertOctagon, 
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CrmAttentionQueueWidgetProps {
  queue: AttentionQueueItem[];
}

export function CrmAttentionQueueWidget({ queue }: CrmAttentionQueueWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredItems = queue.filter(item => {
    if (filter === 'all') return true;
    return item.urgency === filter;
  });

  const criticalCount = queue.filter(q => q.urgency === 'critical').length;
  const highCount = queue.filter(q => q.urgency === 'high').length;
  const mediumCount = queue.filter(q => q.urgency === 'medium').length;

  const displayItems = expanded ? filteredItems : filteredItems.slice(0, 5);

  const getCategoryConfig = (category: AttentionQueueItem['category']) => {
    switch (category) {
      case 'overdue':
        return { label: 'Tarefa Atrasada', icon: Clock, badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'viewing_today':
        return { label: 'Visita Hoje', icon: Calendar, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'no_first_contact':
        return { label: 'Sem 1º Contacto', icon: PhoneCall, badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'stale':
        return { label: 'Lead Parado (Stale)', icon: AlertOctagon, badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'high_priority':
        return { label: 'Alta Prioridade', icon: Flame, badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'no_next_action':
      default:
        return { label: 'Sem Ação Futura', icon: AlertCircle, badge: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      {/* Header do Widget */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              criticalCount > 0 
                ? 'bg-rose-100 text-rose-700 animate-pulse' 
                : queue.length > 0 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Fila de Atenção Imediata (CRM Intelligence)
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {queue.length} {queue.length === 1 ? 'oportunidade' : 'oportunidades'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Sinais operacionais calculados por regras determinísticas para priorização diária da equipa.
              </p>
            </div>
          </div>

          {/* Filtros de Urgência */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({queue.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('critical')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Críticos ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('high')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'high'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Altos ({highCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('medium')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'medium'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Moderados ({mediumCount})
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo da Fila */}
      {queue.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Carteira 100% em dia!</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Nenhuma oportunidade comercial requer ação urgente no momento. Todos os primeiros contactos, visitas e tarefas agendadas estão regularizados.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-500">
          Nenhum lead com nível de urgência "{filter}".
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {displayItems.map((item) => {
            const cat = getCategoryConfig(item.category);
            const CatIcon = cat.icon;

            return (
              <div 
                key={item.leadId} 
                className="p-4 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${cat.badge}`}>
                      <CatIcon className="w-3 h-3" />
                      {cat.label}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.urgency === 'critical' ? 'bg-rose-100 text-rose-800' :
                      item.urgency === 'high' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.urgency === 'critical' ? 'Urgência Crítica' : item.urgency === 'high' ? 'Urgência Alta' : 'Urgência Moderada'}
                    </span>

                    <LeadHealthBadge status={item.health} size="sm" />
                    <LeadScoreBadge score={item.score} size="sm" showExplanationModal={false} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/crm/leads/${item.leadId}`}
                      className="font-bold text-sm text-gray-900 hover:text-brand-green transition-colors truncate"
                    >
                      {item.customerName}
                    </Link>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 truncate" title={item.propertyTitle}>
                      {item.propertyTitle}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-medium">
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <Link to={`/crm/leads/${item.leadId}`}>
                    <Button
                      size="sm"
                      className={`text-xs font-semibold gap-1.5 h-8 ${
                        item.urgency === 'critical'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-brand-green hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botão de Expandir se houver mais de 5 itens */}
      {filteredItems.length > 5 && (
        <div className="p-3 bg-gray-50/70 border-t border-gray-100 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-600 hover:text-gray-900 gap-1.5"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Mostrar Menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Ver Todas as {filteredItems.length} Oportunidades
              </>
            )}
          </Button>
        </div>
      )}

      {/* Rodapé explicativo */}
      <div className="px-5 py-2.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
          Priorização operacional determinística baseada no tempo de SLA e status de tarefas
        </span>
        <span className="font-mono text-[10px]">
          Fase 5.5 CRM Intelligence
        </span>
      </div>
    </div>
  );
}
