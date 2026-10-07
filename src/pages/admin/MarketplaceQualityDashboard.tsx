import React, { useState, useMemo } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { LoadingScreen } from '@/components/LoadingScreen';
import { calculateMarketplaceHealth } from '@/utils/marketplaceHealth';
import { marketplaceModerationService } from '@/services/marketplaceModerationService';
import { propertyFreshnessService } from '@/services/propertyFreshnessService';
import { propertyDuplicateService } from '@/services/propertyDuplicateService';
import { 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Filter, 
  Eye, 
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Property, PropertyReport } from '@/types';
import { DuplicateCandidate } from '@/types/trustQuality';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

export function MarketplaceQualityDashboard() {
  const { properties, loading, refreshProperties } = useProperties();
  const [reports, setReports] = useState<PropertyReport[]>([]);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'duplicates'>('overview');

  // Cálculo determinístico das métricas do marketplace
  const metrics = useMemo(() => {
    return calculateMarketplaceHealth(properties, reports, duplicateCandidates);
  }, [properties, reports, duplicateCandidates]);

  // Fila consolidada de moderação
  const moderationQueue = useMemo(() => {
    return marketplaceModerationService.buildModerationQueue(properties, reports, duplicateCandidates);
  }, [properties, reports, duplicateCandidates]);

  const handleApproveProperty = async (propertyId: string) => {
    try {
      await marketplaceModerationService.processModerationAction(propertyId, 'approve', 'admin');
      toast.success('Anúncio aprovado com sucesso!');
      if (refreshProperties) await refreshProperties();
    } catch (err) {
      toast.error('Erro ao aprovar anúncio.');
    }
  };

  const handleRejectProperty = async (propertyId: string) => {
    try {
      await marketplaceModerationService.processModerationAction(propertyId, 'reject', 'admin');
      toast.warning('Anúncio rejeitado e desativado.');
      if (refreshProperties) await refreshProperties();
    } catch (err) {
      toast.error('Erro ao rejeitar anúncio.');
    }
  };

  const handleResolveDuplicate = async (candidateId: string, resolution: 'confirmed_duplicate' | 'false_positive') => {
    try {
      await propertyDuplicateService.resolveCandidate(candidateId, resolution, 'admin');
      setDuplicateCandidates(prev => prev.filter(c => c.id !== candidateId));
      setSelectedCandidate(null);
      toast.success(resolution === 'confirmed_duplicate' ? 'Duplicado confirmado e registado.' : 'Sinalização descartada (falso positivo).');
    } catch (err) {
      toast.error('Erro ao processar resolução de duplicado.');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const trustTierBadge = {
    excellent: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    strong: 'bg-blue-50 text-blue-800 border-blue-300',
    moderate: 'bg-amber-50 text-amber-800 border-amber-300',
    needs_attention: 'bg-rose-50 text-rose-800 border-rose-300'
  }[metrics.trustTier];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-green" />
            Qualidade & Confiança do Marketplace (V1)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Auditoria determinística de frescura, qualidade de dados, moderação e duplicados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              if (refreshProperties) refreshProperties();
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </Button>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-brand-green text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Visão Geral de Confiança
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'moderation'
                ? 'border-brand-green text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Fila de Moderação</span>
            {moderationQueue.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {moderationQueue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'duplicates'
                ? 'border-brand-green text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Detecção de Duplicados</span>
            {duplicateCandidates.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                {duplicateCandidates.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cartões Principais de Saúde */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Índice de Confiança */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Marketplace Trust Index
                </span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${trustTierBadge}`}>
                  {metrics.trustTier.toUpperCase()}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {metrics.marketplaceTrustIndex}<span className="text-sm font-medium text-gray-400">/100</span>
              </div>
              <p className="text-xs text-gray-500">
                Baseado em frescura, qualidade, verificações e conformidade.
              </p>
            </div>

            {/* Frescura do Inventário */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Inventário Atualizado
                </span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {metrics.freshness.freshPercentage}%
              </div>
              <p className="text-xs text-gray-500">
                {metrics.freshness.freshCount} de {metrics.approvedListings} imóveis confirmados recentemente.
              </p>
            </div>

            {/* Qualidade Média dos Anúncios */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quality Score Médio
                </span>
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {metrics.quality.averageQualityScore}<span className="text-sm font-medium text-gray-400">/100</span>
              </div>
              <p className="text-xs text-gray-500">
                {metrics.quality.excellentCount} excelentes, {metrics.quality.poorCount} a necessitar de melhoria.
              </p>
            </div>

            {/* Taxa de Verificação */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Imóveis Verificados
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {metrics.verifications.verificationRate}%
              </div>
              <p className="text-xs text-gray-500">
                {metrics.verifications.verifiedPropertiesCount} com auditoria ou vistoria documental.
              </p>
            </div>
          </div>

          {/* Gráfico / Distribuição de Frescura e Qualidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribuição de Frescura */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Distribuição de Disponibilidade (Freshness)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                    <span>Disponibilidade Fresca (&lt; 15 dias)</span>
                    <span className="text-emerald-700 font-semibold">{metrics.freshness.freshCount}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${metrics.approvedListings ? (metrics.freshness.freshCount / metrics.approvedListings) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                    <span>A Expirar Brevemente (15-30 dias)</span>
                    <span className="text-amber-700 font-semibold">{metrics.freshness.expiringSoonCount}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400" 
                      style={{ width: `${metrics.approvedListings ? (metrics.freshness.expiringSoonCount / metrics.approvedListings) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                    <span>Pendente de Reconfirmação (&gt; 30 dias)</span>
                    <span className="text-rose-600 font-semibold">{metrics.freshness.pendingConfirmationCount}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-400" 
                      style={{ width: `${metrics.approvedListings ? (metrics.freshness.pendingConfirmationCount / metrics.approvedListings) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                    <span>Expirados (&gt; 37 dias sem confirmação)</span>
                    <span className="text-gray-500 font-semibold">{metrics.freshness.expiredCount}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-400" 
                      style={{ width: `${metrics.approvedListings ? (metrics.freshness.expiredCount / metrics.approvedListings) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Distribuição de Qualidade */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Composição por Quality Score
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 rounded bg-emerald-50 text-emerald-900 border border-emerald-100">
                  <span className="font-semibold">Excelente (80 a 100 pts)</span>
                  <span className="font-bold">{metrics.quality.excellentCount} imóveis</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded bg-blue-50 text-blue-900 border border-blue-100">
                  <span className="font-semibold">Bom (60 a 79 pts)</span>
                  <span className="font-bold">{metrics.quality.goodCount} imóveis</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded bg-amber-50 text-amber-900 border border-amber-100">
                  <span className="font-semibold">Razoável (40 a 59 pts)</span>
                  <span className="font-bold">{metrics.quality.fairCount} imóveis</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded bg-rose-50 text-rose-900 border border-rose-100">
                  <span className="font-semibold">Precisa Melhorar (&lt; 40 pts)</span>
                  <span className="font-bold">{metrics.quality.poorCount} imóveis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Fila de Moderação */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Itens Aguardando Moderação ({moderationQueue.length})
            </h3>
            <span className="text-xs text-gray-500">
              Ordenados por prioridade determinística
            </span>
          </div>

          {moderationQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              Nenhum item pendente de moderação no momento. Marketplace em conformidade!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {moderationQueue.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        item.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                        item.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Motivo: {item.reason === 'new_listing' ? 'Novo Anúncio' : item.reason === 'user_report' ? 'Denúncia de Usuário' : 'Suspeita de Duplicado'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-900 text-sm">{item.propertyTitle}</h4>
                    <p className="text-xs text-gray-500">
                      {item.location} · {item.price.toLocaleString()} MZN · Agente: {item.agentName || item.agentId}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/properties/${item.propertyId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Anúncio</span>
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => handleApproveProperty(item.propertyId)}
                      className="bg-brand-green hover:bg-brand-green/90 text-gray-900 text-xs font-semibold h-8"
                    >
                      Aprovar
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectProperty(item.propertyId)}
                      className="text-xs h-8"
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Detecção de Duplicados */}
      {activeTab === 'duplicates' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Candidatos a Duplicados Identificados
              </h3>
              <p className="text-xs text-gray-500">
                Regra 11: Candidatos para revisão humana. Nenhum anúncio é apagado automaticamente.
              </p>
            </div>
          </div>

          {duplicateCandidates.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              Nenhum par de duplicados detectado com similaridade superior a 65%.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {duplicateCandidates.map((dup) => (
                <div key={dup.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900">
                        Similaridade: {dup.similarityScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="font-semibold text-gray-700 block">Anúncio Primário:</span>
                        <span>{dup.primaryPropertyTitle}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 block">Anúncio Comparado:</span>
                        <span>{dup.comparedPropertyTitle}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 pt-1">
                      Fatores: {dup.matchingFactors.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveDuplicate(dup.id, 'false_positive')}
                      className="text-xs h-8"
                    >
                      Falso Positivo
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleResolveDuplicate(dup.id, 'confirmed_duplicate')}
                      className="text-xs h-8"
                    >
                      Confirmar Duplicado
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
