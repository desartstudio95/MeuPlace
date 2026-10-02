import React from 'react';
import { AgentPerformanceItem } from '@/services/crmAnalyticsService';
import { Users, CheckSquare, Eye, Trophy } from 'lucide-react';

interface CrmAgentPerformanceTableProps {
  agents: AgentPerformanceItem[];
}

export function CrmAgentPerformanceTable({ agents }: CrmAgentPerformanceTableProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-green" />
            Desempenho Operacional Comercial
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Métricas de acompanhamento operacional da carteira de atendimento (sem ranqueamento competitivo).
          </p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-xs">
          Nenhum dado operacional de agente disponível no período.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 pr-4">Responsável</th>
                <th className="py-2.5 px-2 text-center">Atribuídos</th>
                <th className="py-2.5 px-2 text-center">Contactados</th>
                <th className="py-2.5 px-2 text-center">Qualificados</th>
                <th className="py-2.5 px-2 text-center">Negociando</th>
                <th className="py-2.5 px-2 text-center">Ganhos</th>
                <th className="py-2.5 px-2 text-center">Follow-ups Pend.</th>
                <th className="py-2.5 px-2 text-center">Follow-ups Conc.</th>
                <th className="py-2.5 px-2 text-center">Visitas</th>
                <th className="py-2.5 pl-3 text-right">Taxa Fechamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.map((ag) => (
                <tr key={ag.agentId} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-gray-900 whitespace-nowrap">
                    {ag.agentName}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-gray-900">
                    {ag.assignedLeads}
                  </td>
                  <td className="py-3 px-2 text-center text-amber-700 font-semibold">
                    {ag.contacted}
                  </td>
                  <td className="py-3 px-2 text-center text-purple-700 font-semibold">
                    {ag.qualified}
                  </td>
                  <td className="py-3 px-2 text-center text-indigo-700 font-semibold">
                    {ag.negotiating}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-800">
                    {ag.won}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800">
                      {ag.pendingTasks}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800">
                      {ag.completedTasks}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-purple-700 font-semibold">
                    {ag.viewings}
                  </td>
                  <td className="py-3 pl-3 text-right font-extrabold">
                    {ag.wonRate !== null ? (
                      <span className="text-emerald-700">{ag.wonRate}%</span>
                    ) : (
                      <span className="text-gray-400 font-normal">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
