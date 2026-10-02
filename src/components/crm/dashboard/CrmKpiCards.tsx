import React from 'react';
import { 
  Users, 
  Sparkles, 
  PhoneCall, 
  UserCheck, 
  Handshake, 
  Trophy, 
  XCircle, 
  Archive, 
  CheckSquare, 
  AlertTriangle, 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  Eye, 
  CalendarCheck, 
  UserX,
  TrendingUp,
  Percent
} from 'lucide-react';

interface CrmKpiCardsProps {
  kpis: {
    leads: {
      total: number;
      new: number;
      contacted: number;
      qualified: number;
      negotiating: number;
      won: number;
      lost: number;
      archived: number;
      wonRate: number | null;
      qualificationRate: number | null;
      contactRate: number | null;
    };
    tasks: {
      total: number;
      pending: number;
      overdue: number;
      today: number;
      upcoming: number;
      completed: number;
      cancelled: number;
      completionRate: number | null;
    };
    viewings: {
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
      noShow: number;
      completionRate: number | null;
    };
  };
}

export function CrmKpiCards({ kpis }: CrmKpiCardsProps) {
  const { leads, tasks, viewings } = kpis;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. SEÇÃO DE KPIS PRINCIPAIS — LEADS & CONVERSÃO COMERCIAL */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-green" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Pipeline de Leads & Fechamento
            </h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Total Elegível: {leads.total - leads.archived} leads
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Leads */}
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Leads</span>
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{leads.total}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">
              {leads.total === 0 ? 'Sem registos no período' : `${leads.total} captados`}
            </p>
          </div>

          {/* Novos (Entrada) */}
          <div className="bg-white p-4 rounded-xl border border-blue-200/70 bg-gradient-to-b from-blue-50/20 to-transparent shadow-2xs">
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Novos</span>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{leads.new}</div>
            <p className="text-[10px] text-blue-600/80 mt-1 truncate">
              Aguardando contacto
            </p>
          </div>

          {/* Contactados */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/70 bg-gradient-to-b from-amber-50/20 to-transparent shadow-2xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Contactados</span>
              <PhoneCall className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{leads.contacted}</div>
            <p className="text-[10px] text-amber-600/80 mt-1 truncate">
              Primeiro contacto feito
            </p>
          </div>

          {/* Qualificados */}
          <div className="bg-white p-4 rounded-xl border border-purple-200/70 bg-gradient-to-b from-purple-50/20 to-transparent shadow-2xs">
            <div className="flex items-center justify-between text-purple-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Qualificados</span>
              <UserCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{leads.qualified}</div>
            <p className="text-[10px] text-purple-600/80 mt-1 truncate">
              Perfil e interesse aptos
            </p>
          </div>

          {/* Em Negociação */}
          <div className="bg-white p-4 rounded-xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50/20 to-transparent shadow-2xs">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Negociação</span>
              <Handshake className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-700">{leads.negotiating}</div>
            <p className="text-[10px] text-indigo-600/80 mt-1 truncate">
              Proposta em andamento
            </p>
          </div>

          {/* Ganhos (Won) */}
          <div className="bg-white p-4 rounded-xl border border-emerald-300 bg-gradient-to-b from-emerald-50/40 to-transparent shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Fechados (Won)</span>
              <Trophy className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-800">{leads.won}</div>
            <p className="text-[10px] text-emerald-700/80 mt-1 font-semibold truncate">
              Taxa: {leads.wonRate !== null ? `${leads.wonRate}%` : 'Dados insuficientes'}
            </p>
          </div>
        </div>

        {/* Taxas de Conversão & Desfechos Laterais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Taxa de Fechamento</span>
              <span className="text-base font-extrabold text-gray-900">
                {leads.wonRate !== null ? `${leads.wonRate}%` : '--'}
              </span>
            </div>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Taxa de Atendimento</span>
              <span className="text-base font-extrabold text-gray-900">
                {leads.contactRate !== null ? `${leads.contactRate}%` : '--'}
              </span>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>

          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Leads Perdidos (Lost)</span>
              <span className="text-base font-extrabold text-rose-700">{leads.lost}</span>
            </div>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>

          <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Arquivados</span>
              <span className="text-base font-extrabold text-gray-700">{leads.archived}</span>
            </div>
            <Archive className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SEÇÃO DE KPIS OPERACIONAIS — FOLLOW-UPS E VISITAS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Follow-ups (Tarefas) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-brand-green" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Follow-ups & Tarefas
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Taxa de Conclusão: <strong className="text-gray-900">{tasks.completionRate !== null ? `${tasks.completionRate}%` : '--'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Pendentes</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-amber-800">{tasks.pending}</div>
            </div>

            <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200/60">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Atrasadas</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-800">{tasks.overdue}</div>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/60">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Para Hoje</span>
                <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-800">{tasks.today}</div>
            </div>

            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Concluídas</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-800">{tasks.completed}</div>
            </div>
          </div>
        </div>

        {/* Visitas (Viewings) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Visitas aos Imóveis
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Taxa de Realização: <strong className="text-gray-900">{viewings.completionRate !== null ? `${viewings.completionRate}%` : '--'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-200/60">
              <div className="flex items-center justify-between text-purple-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Pendentes</span>
                <Clock className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-800">{viewings.pending}</div>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/60">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Confirmadas</span>
                <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-800">{viewings.confirmed}</div>
            </div>

            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[10px] font-bold uppercase">Realizadas</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-800">{viewings.completed}</div>
            </div>

            <div className="bg-gray-100 p-2.5 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <span className="text-[10px] font-bold uppercase">Canceladas / No-show</span>
                <UserX className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="text-xl font-bold text-gray-800">{viewings.cancelled + viewings.noShow}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
