import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LeadTask } from '@/types';
import { crmQueryService } from '@/services/crmQueryService';
import { leadTaskService } from '@/services/leadTaskService';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ArrowRight, 
  XCircle, 
  RefreshCw,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface LeadTasksQueueTabProps {
  userId: string;
}

export function LeadTasksQueueTab({ userId }: LeadTasksQueueTabProps) {
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [data, setData] = useState<{
    overdue: LeadTask[];
    today: LeadTask[];
    upcoming: LeadTask[];
    totalPending: number;
  }>({
    overdue: [],
    today: [],
    upcoming: [],
    totalPending: 0
  });

  const loadQueue = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const queue = await crmQueryService.getFollowUpQueue(userId, 50);
      setData(queue);
    } catch (e) {
      console.error('[LeadTasksQueueTab] Erro ao carregar fila:', e);
      toast.error('Erro ao buscar tarefas pendentes.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setCompletingId(taskId);
      await leadTaskService.completeTask(taskId, 'Concluído na Fila Operacional');
      toast.success('Tarefa concluída!');
      await loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao concluir tarefa.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancel = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja cancelar esta tarefa?')) return;
    try {
      await leadTaskService.cancelTask(taskId, 'Cancelada pelo operador');
      toast.info('Tarefa cancelada.');
      await loadQueue();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar tarefa.');
    }
  };

  const renderTaskList = (tasks: LeadTask[], emptyText: string) => {
    if (tasks.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        {tasks.map((task) => {
          const isCompleting = completingId === task.id;

          return (
            <div
              key={task.id}
              className="p-3.5 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900">
                    {task.title}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      task.priority === 'high'
                        ? 'bg-rose-50 text-rose-700'
                        : task.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                {task.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {task.dueAt?.replace('T', ' ')}
                  </span>
                  <span>
                    Lead:{' '}
                    <strong className="font-mono text-gray-600">
                      {task.leadId.slice(0, 8)}...
                    </strong>
                  </span>
                </div>
              </div>

              {/* Botões Operacionais */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isCompleting}
                  onClick={(e) => handleComplete(task.id, e)}
                  className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Concluir
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleCancel(task.id, e)}
                  className="h-7 text-xs text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-2"
                  title="Cancelar tarefa"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>

                <Link to={`/crm/leads/${task.leadId}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-brand-green hover:bg-emerald-50 px-2"
                    title="Abrir Lead 360°"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-green" />
        Carregando fila operacional de follow-ups...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo da Fila */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-brand-green" /> Fila de Follow-up Pessoal
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gerencie seus compromissos, ligações e tarefas de atendimento agrupadas por urgência.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadQueue}
          className="text-xs gap-1.5 h-8"
        >
          <RefreshCw className="w-3 h-3" /> Atualizar Fila
        </Button>
      </div>

      {/* 1. Bloco de Tarefas Atrasadas (Overdue) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Atrasadas ({data.overdue.length})</span>
        </div>
        {renderTaskList(data.overdue, 'Nenhuma tarefa atrasada. Parabéns!')}
      </div>

      {/* 2. Bloco de Tarefas de Hoje (Today) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Para Hoje ({data.today.length})</span>
        </div>
        {renderTaskList(data.today, 'Nenhuma tarefa agendada para hoje.')}
      </div>

      {/* 3. Bloco de Tarefas Próximas (Upcoming) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Próximas Tarefas ({data.upcoming.length})</span>
        </div>
        {renderTaskList(data.upcoming, 'Nenhuma tarefa futura agendada.')}
      </div>
    </div>
  );
}
