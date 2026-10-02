import React, { useState } from 'react';
import { ScoreBreakdownItem } from '@/utils/crmIntelligence';
import { 
  Award, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeadScoreBadgeProps {
  score: number; // 0 - 100
  breakdown?: ScoreBreakdownItem[];
  size?: 'sm' | 'md' | 'lg';
  showExplanationModal?: boolean;
}

export function LeadScoreBadge({
  score,
  breakdown = [],
  size = 'md',
  showExplanationModal = true
}: LeadScoreBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determinação determinística de cor
  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeLabel = 'Alto Engajamento';
  if (score < 25) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeLabel = 'Baixo Engajamento';
  } else if (score < 50) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeLabel = 'Engajamento Moderado';
  } else if (score < 75) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    badgeLabel = 'Bom Engajamento';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  }[size];

  return (
    <>
      <button
        type="button"
        onClick={() => showExplanationModal && breakdown.length > 0 && setIsOpen(true)}
        className={`inline-flex items-center font-bold rounded-lg border transition-all ${colorClasses} ${sizeClasses} ${
          showExplanationModal && breakdown.length > 0 ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'
        }`}
        title="Pontuação determinística do Lead (Clique para ver a justificativa)"
      >
        <Award className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>Score {score}/100</span>
        {showExplanationModal && breakdown.length > 0 && (
          <HelpCircle className="w-3 h-3 opacity-60 hover:opacity-100 ml-0.5" />
        )}
      </button>

      {/* Modal de Explicação Determinística (Explainable Scoring) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Justificativa do Lead Score</h3>
                  <p className="text-[11px] text-gray-500">Cálculo determinístico baseado em regras explícitas (Zero IA)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Principal */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pontuação Final</span>
                <span className="text-2xl font-extrabold text-gray-900">{score}</span>
                <span className="text-xs text-gray-500 font-medium"> / 100</span>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClasses}`}>
                {badgeLabel}
              </div>
            </div>

            {/* Lista de Regras Aplicadas (Explainability) */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Composição dos Pontos
              </span>
              {breakdown.map((item, index) => {
                const isPositive = item.points > 0;
                return (
                  <div
                    key={`${item.ruleId}_${index}`}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                      isPositive ? 'bg-emerald-50/50 text-emerald-950' : 'bg-rose-50/50 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className="truncate text-[11px]">{item.description}</span>
                    </div>
                    <span className={`font-mono font-bold text-xs shrink-0 ${
                      isPositive ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isPositive ? `+${item.points}` : `${item.points}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Regras transparentes e auditáveis
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs h-7"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
