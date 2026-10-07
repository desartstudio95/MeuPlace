import React from 'react';
import { Property } from '@/types';
import { calculatePropertyFreshness } from '@/utils/propertyFreshness';
import { PropertyQualityBadge } from './PropertyQualityBadge';
import { PropertyFreshnessBadge } from './PropertyFreshnessBadge';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Flag, 
  ShieldAlert, 
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropertyTrustTransparencyCardProps {
  property: Property;
  onOpenReportModal?: () => void;
  className?: string;
}

export const PropertyTrustTransparencyCard: React.FC<PropertyTrustTransparencyCardProps> = ({
  property,
  onOpenReportModal,
  className = ''
}) => {
  const freshness = calculatePropertyFreshness(property);
  const isAgentVerified = property.agent?.isVerified === true;
  const isPropertyInspected = property.inPersonInspected === true;
  const isDocVerified = property.verificationStatus === 'approved';
  const hasPhone = Boolean(property.agent?.phone || property.agent?.whatsapp);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-green/10 text-brand-green rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Transparência & Confiança</h3>
            <p className="text-xs text-gray-500">Informações auditáveis e verificações do anúncio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PropertyFreshnessBadge property={property} />
          <PropertyQualityBadge property={property} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Sinais de Verificação Auditáveis */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Sinais de Verificação
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* 1. Identidade do Anunciante */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isAgentVerified ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <div className="flex items-center gap-2">
                {isAgentVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span>Identidade do Anunciante</span>
              </div>
              <span className="font-medium text-[11px] text-gray-500">
                {isAgentVerified ? 'Verificado' : 'Não verificado'}
              </span>
            </div>

            {/* 2. Contacto Telefónico */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${hasPhone ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Contacto Directo</span>
              </div>
              <span className="font-medium text-[11px] text-emerald-700">Confirmado</span>
            </div>

            {/* 3. Vistoria Presencial MeuPlace */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isPropertyInspected ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <div className="flex items-center gap-2">
                {isPropertyInspected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span>Vistoria Presencial</span>
              </div>
              <span className="font-medium text-[11px] text-gray-500">
                {isPropertyInspected ? 'Inspecionado' : 'Não vistoriado'}
              </span>
            </div>

            {/* 4. Documentação do Imóvel */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isDocVerified ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <div className="flex items-center gap-2">
                {isDocVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span>Registo Predial / DUAT</span>
              </div>
              <span className="font-medium text-[11px] text-gray-500">
                {isDocVerified ? 'Validado' : 'Sob consulta'}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Segurança e Boas Práticas em Moçambique */}
        <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-semibold block">Dica de Segurança MeuPlace</span>
            <p className="text-amber-800 leading-relaxed">
              Agende sempre uma visita presencial ao imóvel antes de efetuar qualquer pagamento ou sinal financeiro via M-Pesa, e-Mola ou transferência bancária. Em caso de dúvidas, utilize o canal de denúncias abaixo.
            </p>
          </div>
        </div>

        {/* Rodapé com Ação de Report */}
        {onOpenReportModal && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Encontrou alguma informação incorreta neste anúncio?</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenReportModal}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Reportar Anúncio</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
