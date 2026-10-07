import React, { useState } from 'react';
import { Property } from '@/types';
import { calculatePropertyQualityScore } from '@/utils/propertyQualityScore';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Camera, 
  FileText, 
  Layers, 
  MapPin, 
  Tv, 
  X 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface PropertyQualityBadgeProps {
  property: Property;
  className?: string;
  interactive?: boolean;
}

export const PropertyQualityBadge: React.FC<PropertyQualityBadgeProps> = ({
  property,
  className = '',
  interactive = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const result = calculatePropertyQualityScore(property);

  const tierColors = {
    excellent: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    good: 'bg-blue-50 text-blue-800 border-blue-300',
    fair: 'bg-amber-50 text-amber-800 border-amber-300',
    poor: 'bg-rose-50 text-rose-800 border-rose-300'
  };

  const categoryIcons: Record<string, React.ElementType> = {
    media: Camera,
    description: FileText,
    specs: Layers,
    location: MapPin,
    features: Sparkles,
    finance: Tv
  };

  return (
    <>
      <button
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${tierColors[result.tier]} ${interactive ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'} ${className}`}
        title={`Qualidade do anúncio: ${result.score}/100 (${result.label})`}
      >
        <span className="font-semibold">{result.score}/100</span>
        <span className="text-gray-400">·</span>
        <span>{result.label}</span>
        {interactive && <HelpCircle className="w-3 h-3 text-current opacity-70 ml-0.5" />}
      </button>

      {/* Modal de Explicabilidade Transparente */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-lg font-bold text-gray-900">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-green" />
                Índice de Qualidade do Anúncio
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${tierColors[result.tier]}`}>
                {result.score}/100 · {result.label}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              A pontuação é 100% determinística baseada na riqueza de informações, fotos e transparência do anúncio.
            </DialogDescription>
          </DialogHeader>

          {/* Barra de Progresso */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>Nível de Completude</span>
              <span>{result.completenessPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  result.score >= 80 ? 'bg-emerald-500' :
                  result.score >= 60 ? 'bg-blue-500' :
                  result.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          {/* Breakdown de Fatores */}
          <div className="space-y-3 pt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Composição da Pontuação ({result.score} pts)
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100">
              {result.breakdown.map((item) => {
                const Icon = categoryIcons[item.category] || Info;
                return (
                  <div key={item.id} className="pt-2 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <div className={`p-1 rounded shrink-0 ${item.achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-gray-500 text-[11px]">{item.description}</div>
                      </div>
                    </div>
                    <div className="shrink-0 font-semibold text-right">
                      <span className={item.points > 0 ? 'text-emerald-700' : item.points < 0 ? 'text-rose-600' : 'text-gray-400'}>
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                      {item.maxPoints > 0 && (
                        <span className="text-gray-400 font-normal"> / {item.maxPoints}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Penalidades se houver */}
          {result.penaltyItems.length > 0 && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Penalidades Aplicadas
              </h4>
              {result.penaltyItems.map((p, idx) => (
                <div key={idx} className="flex justify-between text-xs bg-rose-50 p-2 rounded border border-rose-200">
                  <span className="text-rose-800">{p.description}</span>
                  <span className="font-bold text-rose-700">{p.penalty} pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Recomendações de Melhoria */}
          {result.suggestions.length > 0 && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Como Aumentar a Pontuação:
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600">
                {result.suggestions.slice(0, 3).map((sugg, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-green font-bold">›</span>
                    <span>{sugg}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
