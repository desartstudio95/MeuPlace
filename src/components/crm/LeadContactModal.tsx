import React, { useState } from 'react';
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
import { Phone, MessageSquare, Mail, PhoneCall } from 'lucide-react';
import { leadActivityService } from '@/services/leadActivityService';

interface LeadContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  propertyId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  onContactLogged: () => void;
}

export function LeadContactModal({
  isOpen,
  onClose,
  leadId,
  propertyId,
  customerName,
  customerPhone,
  customerEmail,
  onContactLogged
}: LeadContactModalProps) {
  const [channel, setChannel] = useState<'whatsapp' | 'phone' | 'email'>('whatsapp');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await leadActivityService.logLeadContacted(
        leadId,
        propertyId,
        channel,
        notes.trim() ? notes.trim() : undefined
      );

      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'phone' ? 'Chamada Telefónica' : 'Email';
      toast.success(`Contacto via ${channelLabel} registrado na timeline com sucesso!`);
      onContactLogged();
      onClose();
      setNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar contacto comercial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <PhoneCall className="w-5 h-5 text-brand-green" />
            Registrar Contacto Comercial
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Grave na timeline comercial o contacto estabelecido com <strong>{customerName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Seleção do Canal */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Canal Utilizado:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  channel === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 mb-1" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('phone')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  channel === 'phone'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-800 font-semibold ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Phone className="w-4 h-4 text-blue-600 mb-1" />
                <span>Chamada</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  channel === 'email'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800 font-semibold ring-1 ring-indigo-500'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Dados de Apoio */}
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1 border border-gray-100">
            <div>
              <span className="text-gray-400">Telefone:</span>{' '}
              <strong className="font-mono text-gray-800">{customerPhone}</strong>
            </div>
            {customerEmail && (
              <div>
                <span className="text-gray-400">Email:</span>{' '}
                <strong className="text-gray-800">{customerEmail}</strong>
              </div>
            )}
          </div>

          {/* Resumo do Contacto */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Resumo da Interação (Opcional):
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente atendeu, confirmou interesse no T3 e solicitou visita para sábado de manhã."
              rows={3}
              maxLength={2000}
              className="text-xs"
            />
            <span className="text-[10px] text-gray-400 block text-right mt-1">
              {notes.length}/2000 caracteres
            </span>
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
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-brand-green hover:bg-emerald-700 text-white text-xs font-medium"
            >
              {loading ? 'Registrando...' : 'Salvar Contacto na Timeline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
