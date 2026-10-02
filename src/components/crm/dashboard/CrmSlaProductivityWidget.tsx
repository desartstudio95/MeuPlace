import React from 'react';
import { CrmSlaMetrics, CrmSalesProductivity } from '@/services/crmAnalyticsService';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  CalendarCheck, 
  CheckSquare, 
  UserCheck, 
  TrendingUp,
  Percent,
  Timer
} from 'lucide-react';

interface CrmSlaProductivityWidgetProps {
  sla: CrmSlaMetrics;
  productivity: CrmSalesProductivity;
}

export function CrmSlaProductivityWidget({ sla, productivity }: CrmSlaProductivityWidgetProps) {
  const complianceColor = 
    sla.slaComplianceRate === null ? 'text-gray-400' :
    sla.slaComplianceRate >= 80 ? 'text-emerald-600' :
    sla.slaComplianceRate >= 60 ? 'text-amber-600' : 'text-rose-600';

  const complianceBg = 
    sla.slaComplianceRate === null ? 'bg-gray-100' :
    sla.slaComplianceRate >= 80 ? 'bg-emerald-500' :
    sla.slaComplianceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  // Formatação amigável de horas de resposta
  const formatResponseTime = (hours: number | null) => {
    if (hours === null) return 'Dados insuficientes';
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const totalTasksEvaluated = productivity.completedTasks + productivity.overdueTasks;
  const taskCompletionRate = totalTasksEvaluated > 0 
    ? Math.round((productivity.completedTasks / totalTasksEvaluated) * 100) 
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bloco 1: SLA de Atendimento e Tempo de Resposta */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                SLA & Tempo de Resposta Comercial
              </h3>
              <p className="text-[11px] text-gray-500">
                Meta de primeiro contacto comercial: {sla.firstContactSlaHours}h após entrada do lead.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            SLA {sla.firstContactSlaHours}h
          </span>
        </div>

        {/* Métricas Principais de SLA */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tempo Médio */}
          <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Tempo Médio 1º Contacto
            </span>
            <div className="text-2xl font-extrabold text-gray-900">
              {formatResponseTime(sla.averageResponseTimeHours)}
            </div>
            <p className="text-[10px] text-gray-400">
              {sla.leadsContactedCount > 0 
                ? `Baseado em ${sla.leadsContactedCount} contactos realizados` 
                : 'Nenhum contacto comercial no período'}
            </p>
          </div>

          {/* Taxa de Cumprimento SLA */}
          <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Conformidade com SLA
            </span>
            <div className={`text-2xl font-extrabold ${complianceColor}`}>
              {sla.slaComplianceRate !== null ? `${sla.slaComplianceRate}%` : 'Dados insuf.'}
            </div>
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full ${complianceBg} transition-all duration-300`} 
                style={{ width: `${sla.slaComplianceRate || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detalhamento de Volumes SLA */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 block">
              {sla.leadsWithinSlaCount}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">Dentro da Meta</span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
            <span className="text-xs font-bold text-rose-800 block">
              {sla.leadsBreachedSlaCount}
            </span>
            <span className="text-[10px] font-medium text-rose-700">Fora do Prazo</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
            <span className="text-xs font-bold text-amber-800 block">
              {sla.leadsPendingContactCount}
            </span>
            <span className="text-[10px] font-medium text-amber-700">Aguardando Contacto</span>
          </div>
        </div>
      </div>

      {/* Bloco 2: Produtividade Comercial & Eficiência Operacional */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Produtividade da Equipa de Vendas
              </h3>
              <p className="text-[11px] text-gray-500">
                Indicadores reais de execução, visitas realizadas e gargalos operacionais.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            Atividade Real
          </span>
        </div>

        {/* 4 Cards Rápidos de Produtividade */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tarefas Concluídas */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Follow-ups Feitos
            </span>
            <span className="text-xl font-extrabold text-emerald-700">
              {productivity.completedTasks}
            </span>
            <span className="text-[10px] text-gray-400 block">
              {taskCompletionRate !== null ? `${taskCompletionRate}% pontual` : '0 agendadas'}
            </span>
          </div>

          {/* Visitas Concluídas */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Visitas Feitas
            </span>
            <span className="text-xl font-extrabold text-blue-700">
              {productivity.completedViewings}
            </span>
            <span className="text-[10px] text-gray-400 block">Presenciais</span>
          </div>

          {/* Leads Parados (Stale) */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Leads Parados
            </span>
            <span className={`text-xl font-extrabold ${productivity.staleLeadsCount > 0 ? 'text-rose-600' : 'text-gray-700'}`}>
              {productivity.staleLeadsCount}
            </span>
            <span className="text-[10px] text-gray-400 block">&gt;7 dias inativos</span>
          </div>

          {/* Sem Próxima Ação */}
          <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Sem Ação Futura
            </span>
            <span className={`text-xl font-extrabold ${productivity.leadsWithoutNextAction > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
              {productivity.leadsWithoutNextAction}
            </span>
            <span className="text-[10px] text-gray-400 block">Sem follow-up</span>
          </div>
        </div>

        {/* Resumo Operacional de Eficiência */}
        <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Oportunidades em Negociação Ativa:</span>
            <span className="font-bold text-gray-900">{productivity.negotiatingLeads}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Leads Qualificados em Carteira:</span>
            <span className="font-bold text-gray-900">{productivity.qualifiedLeads}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Tarefas Atrasadas Atualmente:</span>
            <span className={`font-bold ${productivity.overdueTasks > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {productivity.overdueTasks}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
