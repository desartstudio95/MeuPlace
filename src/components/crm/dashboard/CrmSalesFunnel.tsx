import React from 'react';
import { FunnelStageData } from '@/services/crmAnalyticsService';
import { ArrowDown, AlertCircle, XCircle, Archive, ShieldCheck } from 'lucide-react';

interface CrmSalesFunnelProps {
  stages: FunnelStageData[];
  lostCount: number;
  lostRate: number | null;
  archivedCount: number;
  archivedRate: number | null;
}

export function CrmSalesFunnel({
  stages,
  lostCount,
  lostRate,
  archivedCount,
  archivedRate
}: CrmSalesFunnelProps) {
  const topStageCount = stages.length > 0 ? stages[0].count : 0;
  const wonStage = stages.find(s => s.stage === 'won');
  const wonCount = wonStage ? wonStage.count : 0;

  const stageColorMap: Record<string, { bg: string; border: string; bar: string; text: string }> = {
    new: {
      bg: 'bg-blue-50/40',
      border: 'border-blue-200',
      bar: 'bg-blue-500',
      text: 'text-blue-700'
    },
    contacted: {
      bg: 'bg-amber-50/40',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
      text: 'text-amber-700'
    },
    qualified: {
      bg: 'bg-purple-50/40',
      border: 'border-purple-200',
      bar: 'bg-purple-500',
      text: 'text-purple-700'
    },
    negotiating: {
      bg: 'bg-indigo-50/40',
      border: 'border-indigo-200',
      bar: 'bg-indigo-500',
      text: 'text-indigo-700'
    },
    won: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-300',
      bar: 'bg-emerald-600',
      text: 'text-emerald-800'
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            Funil de Vendas Comercial (Pipeline)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Progressão sequencial das oportunidades comerciais ativas no período selecionado.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Conversão Geral: {topStageCount > 0 ? `${Math.round((wonCount / topStageCount) * 1000) / 10}%` : '--'}</span>
        </div>
      </div>

      {topStageCount === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-xs font-medium text-gray-500">Sem leads suficientes no funil para o período selecionado.</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Altere o filtro de datas ou selecione outro escopo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-5">
          {/* Coluna 1-3: Etapas do Funil */}
          <div className="lg:col-span-3 space-y-3.5">
            {stages.map((st, index) => {
              const colors = stageColorMap[st.stage] || stageColorMap.new;
              // Largura da barra proporcional à etapa de topo
              const widthPercent = topStageCount > 0 ? Math.max(8, Math.round((st.count / topStageCount) * 100)) : 0;

              return (
                <div key={st.stage} className="relative">
                  <div className={`p-3.5 rounded-xl border ${colors.border} ${colors.bg} transition-all`}>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors.bar}`}>
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{st.label}</span>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-xs text-gray-400 block text-[10px]">Oportunidades</span>
                          <span className="text-sm font-extrabold text-gray-900">{st.count}</span>
                        </div>

                        <div className="min-w-[70px]">
                          <span className="text-xs text-gray-400 block text-[10px]">
                            {index === 0 ? 'Entrada' : 'Passo a Passo'}
                          </span>
                          <span className={`text-xs font-bold ${colors.text}`}>
                            {st.conversionRate !== null ? `${st.conversionRate}%` : 'Dados insuficientes'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso Real */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Seta indicativa de avanço entre etapas */}
                  {index < stages.length - 1 && (
                    <div className="flex justify-center -my-1.5 relative z-10">
                      <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-2xs">
                        <ArrowDown className="w-3 h-3 text-gray-500" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Coluna 4: Desfechos Fora do Funil Principal (Lost & Archived) */}
          <div className="lg:col-span-1 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Desfechos Laterais
            </h4>

            {/* Perdidos */}
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
              <div className="flex items-center gap-2 text-rose-700 mb-1">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold">Leads Perdidos (Lost)</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-rose-800">{lostCount}</span>
                <span className="text-xs font-semibold text-rose-600">
                  {lostRate !== null ? `${lostRate}%` : '--'}
                </span>
              </div>
              <p className="text-[10px] text-rose-700/70 mt-1">
                Não converteram ou fecharam com terceiros.
              </p>
            </div>

            {/* Arquivados */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Archive className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold">Arquivados</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-gray-800">{archivedCount}</span>
                <span className="text-xs font-semibold text-gray-500">
                  {archivedRate !== null ? `${archivedRate}%` : '--'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Contactos inativos ou duplicados descartados.
              </p>
            </div>

            {/* Nota Técnica de Integridade */}
            <div className="text-[10px] text-gray-400 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              Percentagens calculadas estritamente com base nos dados do Firestore. Denominadores nulos são resguardados contra divisão por zero.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
