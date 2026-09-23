import React, { useState } from 'react';
import { LeadPriority } from '@/types';
import { leadService } from '@/services/leadService';
import { LEAD_PRIORITY_CONFIG, LeadPriorityBadge } from './LeadPriorityBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Flag, Check } from 'lucide-react';

interface LeadPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentPriority?: LeadPriority;
  onPriorityUpdated: (newPriority: LeadPriority) => void;
}

export function LeadPriorityModal({
  isOpen,
  onClose,
  leadId,
  currentPriority = 'medium',
  onPriorityUpdated
}: LeadPriorityModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<LeadPriority>(currentPriority);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedPriority(currentPriority);
    }
  }, [isOpen, currentPriority]);

  const handleUpdate = async () => {
    if (selectedPriority === currentPriority) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      await leadService.updateLeadPriority(leadId, selectedPriority);
      toast.success(`Prioridade alterada para "${LEAD_PRIORITY_CONFIG[selectedPriority].label}"`);
      onPriorityUpdated(selectedPriority);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar prioridade do lead.');
    } finally {
      setLoading(false);
    }
  };

  const priorities: LeadPriority[] = ['high', 'medium', 'low'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Flag className="w-5 h-5 text-brand-green" />
            Definir Prioridade do Lead
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Ajuste a prioridade de atendimento operacional deste comprador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-3">
          {priorities.map((p) => {
            const config = LEAD_PRIORITY_CONFIG[p];
            const isSelected = selectedPriority === p;

            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(p)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-brand-green bg-emerald-50/40 ring-1 ring-brand-green'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none">{config.indicator}</span>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Prioridade {config.label}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {p === 'high' && 'Comprador qualificado com alta urgência ou proposta formal.'}
                      {p === 'medium' && 'Interesse confirmado, em processo padrão de follow-up.'}
                      {p === 'low' && 'Dúvidas pontuais, especulação ou baixa urgência temporal.'}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-brand-green shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleUpdate}
            className="bg-brand-green hover:bg-emerald-700 text-white text-xs font-medium"
          >
            {loading ? 'Salvando...' : 'Atualizar Prioridade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
