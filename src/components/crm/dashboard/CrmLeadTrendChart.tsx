import React from 'react';
import { TrendPoint } from '@/services/crmAnalyticsService';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';

interface CrmLeadTrendChartProps {
  data: TrendPoint[];
  periodLabel: string;
}

export function CrmLeadTrendChart({ data, periodLabel }: CrmLeadTrendChartProps) {
  const hasAnyData = data.some(d => d.newLeads > 0 || d.wonLeads > 0 || d.completedViewings > 0);

  // Custom Tooltip estilizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0]?.payload as TrendPoint;
      return (
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-md text-xs space-y-1.5 min-w-[150px]">
          <p className="font-bold text-gray-900 border-b border-gray-100 pb-1">
            {point?.fullDate || label}
          </p>
          <div className="flex items-center justify-between text-blue-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Novos Leads:
            </span>
            <span className="font-bold">{point?.newLeads || 0}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Fechados (Won):
            </span>
            <span className="font-bold">{point?.wonLeads || 0}</span>
          </div>
          <div className="flex items-center justify-between text-purple-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Visitas Realizadas:
            </span>
            <span className="font-bold">{point?.completedViewings || 0}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            Evolução de Leads e Atividade Comercial
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Série temporal de novos leads, negócios fechados e visitas para o período ({periodLabel}).
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <Info className="w-3.5 h-3.5" />
          <span>Dados reais agregados no fuso CAT (Moçambique)</span>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="py-14 text-center text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-xs font-semibold text-gray-600">Sem dados comerciais no período selecionado.</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            O gráfico apresentará pontos reais conforme novos leads e atividades forem registrados.
          </p>
        </div>
      ) : (
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorViewings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} 
              />

              <Area
                type="monotone"
                dataKey="newLeads"
                name="Novos Leads"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNew)"
              />
              <Area
                type="monotone"
                dataKey="wonLeads"
                name="Ganhos (Won)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorWon)"
              />
              <Area
                type="monotone"
                dataKey="completedViewings"
                name="Visitas Concluídas"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorViewings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
