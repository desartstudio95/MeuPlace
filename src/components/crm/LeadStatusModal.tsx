import React, { useState } from 'react';
import { 
  LeadStatus, 
  ALLOWED_LEAD_TRANSITIONS, 
  LEAD_STATUS_VOCABULARY 
} from '@/types';
import { leadService } from '@/services/leadService';
import { LEAD_STATUS_CONFIG, LeadStatusBadge } from './LeadStatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface LeadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentStatus: LeadStatus;
  onStatusUpdated: (newStatus: LeadStatus) => void;
}

export function LeadStatusModal({
  isOpen,
  onClose,
  leadId,
  currentStatus,
  onStatusUpdated
}: LeadStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const allowedTransitions = ALLOWED_LEAD_TRANSITIONS[currentStatus] || [];

  const handleUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Selecione um novo status válido.');
      return;
    }

    if (!allowedTransitions.includes(selectedStatus)) {
      toast.error(`Transição de "${currentStatus}" para "${selectedStatus}" não é permitida pela máquina de estados.`);
      return;
    }

    try {
      setLoading(true);
      await leadService.updateLeadStatus(leadId, selectedStatus, notes);
      toast.success(`Status do lead alterado para "${LEAD_STATUS_CONFIG[selectedStatus].label}"`);
      onStatusUpdated(selectedStatus);
      onClose();
      setSelectedStatus(null);
      setNotes('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar status do lead.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Alterar Estado Comercial do Lead
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            A progressão do lead obedece à máquina de estados estrita do CRM MeuPlace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Estado Atual */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado Atual:</span>
            <LeadStatusBadge status={currentStatus} size="lg" />
          </div>

          {/* Seleção do Próximo Estado */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              Próximo Estado Válido:
            </label>

            {allowedTransitions.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Este lead atingiu um estado terminal. Nenhuma transição direta está disponível.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {LEAD_STATUS_VOCABULARY.map((statusKey) => {
                  const isAllowed = allowedTransitions.includes(statusKey);
                  const isSelected = selectedStatus === statusKey;
                  const isCurrent = currentStatus === statusKey;
                  const config = LEAD_STATUS_CONFIG[statusKey];

                  if (isCurrent) return null;

                  return (
                    <button
                      key={statusKey}
                      type="button"
                      disabled={!isAllowed || loading}
                      onClick={() => isAllowed && setSelectedStatus(statusKey)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                        !isAllowed
                          ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
                          : isSelected
                          ? 'border-brand-green bg-emerald-50/50 text-gray-900 ring-2 ring-brand-green/20 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                        <span className="font-medium">{config.label}</span>
                        {!isAllowed && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> transição bloqueada
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-green" />
                      )}
                      {isAllowed && !isSelected && (
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Anotação de Transição */}
          {selectedStatus && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-150">
              <label htmlFor="status-notes" className="text-xs font-semibold text-gray-700 block">
                Motivo / Anotação da Transição (opcional):
              </label>
              <Textarea
                id="status-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Cliente demonstrou alto interesse na visita e solicitou simulação de financiamento..."
                rows={3}
                maxLength={500}
                className="text-sm"
              />
              <div className="flex justify-between items-center text-[11px] text-gray-400">
                <span>Esta nota será registrada na timeline comercial imutável.</span>
                <span>{notes.length}/500</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUpdate}
            disabled={!selectedStatus || loading || !allowedTransitions.includes(selectedStatus)}
            className="bg-brand-green hover:bg-emerald-700 text-white font-medium"
          >
            {loading ? 'Atualizando...' : 'Confirmar Mudança'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
