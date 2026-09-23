import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { leadService } from '@/services/leadService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserCheck, ShieldAlert, Search } from 'lucide-react';
import { UserProfile } from '@/types';

interface LeadAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentAgentId?: string;
  propertyOwnerId: string;
  onAssigned: (newAgentId: string) => void;
}

export function LeadAssignModal({
  isOpen,
  onClose,
  leadId,
  currentAgentId,
  propertyOwnerId,
  onAssigned
}: LeadAssignModalProps) {
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentAgentId || '');
  const [customAgentId, setCustomAgentId] = useState('');
  const [useCustomId, setUseCustomId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'agent'),
          where('isApproved', '==', true),
          limit(50)
        );
        const snap = await getDocs(q);
        const list: UserProfile[] = snap.docs.map(d => ({
          uid: d.id,
          ...(d.data() as any)
        }));
        setAgents(list);
      } catch (err) {
        console.warn('Não foi possível listar corretores aprovados automaticamente:', err);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [isOpen]);

  const handleAssign = async () => {
    const targetAgentId = useCustomId ? customAgentId.trim() : selectedAgentId;

    if (!targetAgentId) {
      toast.error('Selecione ou informe o identificador do corretor responsável.');
      return;
    }

    if (targetAgentId === currentAgentId) {
      toast.info('Este corretor já é o responsável operacional atual deste lead.');
      onClose();
      return;
    }

    try {
      setLoading(true);
      await leadService.assignLead(leadId, targetAgentId);
      toast.success('Lead reatribuído com sucesso. Histórico registrado e notificação enviada.');
      onAssigned(targetAgentId);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao reatribuir lead.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(a => 
    (a.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-green" />
            Atribuição de Responsável pelo Lead
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Define a custódia operacional do lead. A custódia primária permanece com o proprietário do imóvel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Informações de Custódia */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-gray-600">
              <span>Custódia Primária (Proprietário):</span>
              <span className="font-mono text-gray-900 font-semibold">{propertyOwnerId}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Custódia Operacional Atual:</span>
              <span className="font-mono text-gray-900 font-semibold">
                {currentAgentId || 'Não atribuído individualmente'}
              </span>
            </div>
          </div>

          {/* Alternador de Modo */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {useCustomId ? 'Identificador UID do Corretor' : 'Selecionar Corretor Aprovado'}
            </label>
            <button
              type="button"
              onClick={() => setUseCustomId(!useCustomId)}
              className="text-xs text-brand-green hover:underline font-medium"
            >
              {useCustomId ? 'Ver Lista de Corretores' : 'Inserir ID Manualmente'}
            </button>
          </div>

          {useCustomId ? (
            <div className="space-y-1.5">
              <Input
                type="text"
                placeholder="Ex: usr_corretor_abc123"
                value={customAgentId}
                onChange={(e) => setCustomAgentId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-gray-400">
                O ID deve corresponder a um usuário válido do sistema com papel de corretor.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                {loadingAgents ? (
                  <div className="p-4 text-center text-xs text-gray-500">Carregando corretores cadastrados...</div>
                ) : filteredAgents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    Nenhum corretor encontrado com este critério.
                  </div>
                ) : (
                  filteredAgents.map((agent) => {
                    const isSelected = selectedAgentId === agent.uid;
                    const isCurrent = currentAgentId === agent.uid;

                    return (
                      <button
                        key={agent.uid}
                        type="button"
                        onClick={() => setSelectedAgentId(agent.uid)}
                        className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                          isSelected ? 'bg-emerald-50 text-brand-green font-medium' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold text-gray-900 truncate">
                            {agent.displayName || agent.email || 'Corretor'}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{agent.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrent && (
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                              Atual
                            </span>
                          )}
                          {isSelected && <UserCheck className="w-4 h-4 text-brand-green" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              Ao reatribuir, o novo responsável receberá permissão de leitura sobre os dados do lead e uma notificação em tempo real.
            </span>
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
            type="button"
            onClick={handleAssign}
            disabled={loading || (useCustomId ? !customAgentId.trim() : !selectedAgentId)}
            className="bg-brand-green hover:bg-emerald-700 text-white font-medium"
          >
            {loading ? 'Reatribuindo...' : 'Salvar Responsável'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
