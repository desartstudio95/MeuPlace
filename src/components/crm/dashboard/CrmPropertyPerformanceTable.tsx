import React from 'react';
import { PropertyPerformanceItem } from '@/services/crmAnalyticsService';
import { Building2, Eye, Trophy, Percent, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CrmPropertyPerformanceTableProps {
  properties: PropertyPerformanceItem[];
}

export function CrmPropertyPerformanceTable({ properties }: CrmPropertyPerformanceTableProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-green" />
            Desempenho Comercial por Imóvel
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Volume de leads, visitas e conversão agregados diretamente dos dados no escopo (Zero N+1).
          </p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-xs">
          Nenhum imóvel com atividade registrada no período.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 pr-4">Imóvel</th>
                <th className="py-2.5 px-3 text-center">Leads</th>
                <th className="py-2.5 px-3 text-center">Visitas</th>
                <th className="py-2.5 px-3 text-center">Fechados</th>
                <th className="py-2.5 pl-3 text-right">Taxa Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.slice(0, 10).map((prop) => (
                <tr key={prop.propertyId} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 pr-4 max-w-[220px]">
                    <div className="font-semibold text-gray-900 truncate">
                      {prop.propertyTitle}
                    </div>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      ID: {prop.propertyId.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                      {prop.leadsCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">
                      {prop.viewingsCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800">
                      {prop.wonCount}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-right font-bold text-gray-900">
                    {prop.conversionRate !== null ? (
                      <span className="text-emerald-700">{prop.conversionRate}%</span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">--</span>
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
