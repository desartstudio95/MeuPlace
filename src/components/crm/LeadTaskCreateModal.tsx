import React, { useState } from 'react';
import { LeadTaskPriority } from '@/types';
import { leadTaskService } from '@/services/leadTaskService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { CheckSquare } from 'lucide-react';

interface LeadTaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  propertyId: string;
  defaultAssignedTo: string;
  onTaskCreated: () => void;
}

export function LeadTaskCreateModal({
  isOpen,
  onClose,
  leadId,
  propertyId,
  defaultAssignedTo,
  onTaskCreated
}: LeadTaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<LeadTaskPriority>('medium');
  const [dueAt, setDueAt] = useState('');
  const [assignedTo, setAssignedTo] = useState(defaultAssignedTo);
  const [loading, setLoading] = useState(false);

  // Set default dueAt to tomorrow 10:00 when opened
  React.useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setDueAt(tomorrow.toISOString().slice(0, 16));
      setAssignedTo(defaultAssignedTo);
    }
  }, [isOpen, defaultAssignedTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      toast.error('O título da tarefa deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!dueAt) {
      toast.error('Informe a data de vencimento da tarefa.');
      return;
    }

    if (!assignedTo.trim()) {
      toast.error('Informe o responsável pela tarefa.');
      return;
    }

    try {
      setLoading(true);
      await leadTaskService.createTask({
        leadId,
        propertyId,
        title: cleanTitle,
        description: description.trim() || undefined,
        priority,
        dueAt,
        assignedTo: assignedTo.trim()
      });

      toast.success('Tarefa de follow-up criada com sucesso.');
      onTaskCreated();
      onClose();
      setTitle('');
      setDescription('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar tarefa.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-green" />
              Nova Tarefa de Follow-up
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Agende lembretes, ligações ou envio de documentos vinculados a este lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Título */}
            <div className="space-y-1.5">
              <label htmlFor="task-title" className="text-xs font-semibold text-gray-700 block">
                Título da Tarefa *
              </label>
              <Input
                id="task-title"
                type="text"
                required
                placeholder="Ex: Ligar para confirmar interesse na visita de sábado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="text-sm"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label htmlFor="task-desc" className="text-xs font-semibold text-gray-700 block">
                Descrição / Instruções (opcional)
              </label>
              <Textarea
                id="task-desc"
                placeholder="Ex: Cliente tem interesse em negociar o valor ou formas de pagamento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                className="text-sm"
              />
            </div>

            {/* Prioridade e Vencimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="task-priority" className="text-xs font-semibold text-gray-700 block">
                  Prioridade
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LeadTaskPriority)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta (Urgente)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="task-due" className="text-xs font-semibold text-gray-700 block">
                  Prazo / Vencimento *
                </label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Responsável */}
            <div className="space-y-1.5">
              <label htmlFor="task-assignee" className="text-xs font-semibold text-gray-700 block">
                Atribuir a (UID do Usuário)
              </label>
              <Input
                id="task-assignee"
                type="text"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
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
              type="submit"
              disabled={loading || title.trim().length < 3 || !dueAt}
              className="bg-brand-green hover:bg-emerald-700 text-white font-medium"
            >
              {loading ? 'Salvando...' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
