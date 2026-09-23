import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { crmQueryService, LeadDetailAggregate } from '@/services/crmQueryService';
import { leadService } from '@/services/leadService';
import { leadTaskService } from '@/services/leadTaskService';
import { leadActivityService } from '@/services/leadActivityService';
import { viewingService } from '@/services/viewingService';
import { 
  Lead, 
  LeadStatus, 
  LeadPriority, 
  LeadTask, 
  Viewing, 
  LeadActivity,
  Property 
} from '@/types';
import { DocumentSnapshot } from 'firebase/firestore';
import { LeadStatusBadge } from '@/components/crm/LeadStatusBadge';
import { LeadPriorityBadge } from '@/components/crm/LeadPriorityBadge';
import { LeadStatusModal } from '@/components/crm/LeadStatusModal';
import { LeadPriorityModal } from '@/components/crm/LeadPriorityModal';
import { LeadContactModal } from '@/components/crm/LeadContactModal';
import { LeadAssignModal } from '@/components/crm/LeadAssignModal';
import { LeadTaskCreateModal } from '@/components/crm/LeadTaskCreateModal';
import { LeadTimelineItem, formatActivityDate } from '@/components/crm/LeadTimelineItem';
import { deriveLeadNextAction } from '@/utils/crmNextAction';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MessageCircle, 
  Building2, 
  Calendar, 
  CheckSquare, 
  Clock, 
  User, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  XCircle, 
  CalendarCheck,
  RefreshCw,
  Copy,
  Plus
} from 'lucide-react';

export function CrmLeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // Aggregate Data
  const [lead, setLead] = useState<Lead | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLastDoc, setActivitiesLastDoc] = useState<DocumentSnapshot | null>(null);
  const [activitiesHasMore, setActivitiesHasMore] = useState(false);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);

  // UI / Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Quick note state
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fetch full aggregate
  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await crmQueryService.getLeadDetail(leadId);
      if (!data) {
        setError('Lead não encontrado ou você não possui permissão para acessá-lo.');
        return;
      }

      setLead(data.lead);
      setProperty(data.property);
      setActivities(data.activities);
      setTasks(data.tasks);
      setViewings(data.viewings);

      // Fetch activity pagination info
      const actRes = await leadActivityService.getLeadActivities(leadId, { limitCount: 20 });
      setActivities(actRes.activities);
      setActivitiesLastDoc(actRes.lastDoc);
      setActivitiesHasMore(actRes.hasMore);
    } catch (err: any) {
      console.error('[CrmLeadDetail] Erro ao carregar detalhes:', err);
      setError('Falha ao consultar os dados do lead. Verifique suas permissões de acesso.');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  // Load more activities
  const handleLoadMoreActivities = async () => {
    if (!leadId || !activitiesLastDoc || !activitiesHasMore || loadingMoreActivities) return;
    setLoadingMoreActivities(true);

    try {
      const res = await leadActivityService.getLeadActivities(leadId, {
        limitCount: 20,
        lastDoc: activitiesLastDoc
      });
      setActivities(prev => [...prev, ...res.activities]);
      setActivitiesLastDoc(res.lastDoc);
      setActivitiesHasMore(res.hasMore);
    } catch (err) {
      toast.error('Erro ao carregar histórico anterior.');
    } finally {
      setLoadingMoreActivities(false);
    }
  };

  // Add Commercial Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !noteText.trim()) return;

    if (noteText.trim().length < 3) {
      toast.error('A anotação deve conter pelo menos 3 caracteres.');
      return;
    }

    setSavingNote(true);
    try {
      await leadService.addLeadNote(leadId, noteText.trim());
      toast.success('Nota comercial adicionada com sucesso.');
      setNoteText('');
      
      // Refresh activities immediately
      const actRes = await leadActivityService.getLeadActivities(leadId, { limitCount: 20 });
      setActivities(actRes.activities);
      setActivitiesLastDoc(actRes.lastDoc);
      setActivitiesHasMore(actRes.hasMore);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar nota.';
      toast.error(msg);
    } finally {
      setSavingNote(false);
    }
  };

  // Complete Task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await leadTaskService.completeTask(taskId);
      toast.success('Tarefa concluída!');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      
      // Refresh activities
      if (leadId) {
        const actRes = await leadActivityService.getLeadActivities(leadId, { limitCount: 20 });
        setActivities(actRes.activities);
      }
    } catch (err) {
      toast.error('Falha ao concluir tarefa.');
    }
  };

  // Cancel Task
  const handleCancelTask = async (taskId: string) => {
    try {
      await leadTaskService.cancelTask(taskId);
      toast.success('Tarefa cancelada.');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'cancelled' } : t));
    } catch (err) {
      toast.error('Falha ao cancelar tarefa.');
    }
  };

  // Update Viewing Status
  const handleUpdateViewingStatus = async (viewingId: string, newStatus: any) => {
    try {
      await viewingService.updateViewingStatus(viewingId, newStatus);
      toast.success(`Status da visita alterado para "${newStatus}".`);
      setViewings(prev => prev.map(v => v.id === viewingId ? { ...v, status: newStatus } : v));
      
      // Refresh activities
      if (leadId) {
        const actRes = await leadActivityService.getLeadActivities(leadId, { limitCount: 20 });
        setActivities(actRes.activities);
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar visita.');
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  // Check permissions for reassigning
  const canReassign = Boolean(
    currentUser && (
      userProfile?.role === 'admin' ||
      lead?.propertyOwnerId === currentUser.uid ||
      lead?.agentId === currentUser.uid
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Lead Inacessível</h2>
            <p className="text-xs text-gray-500 mt-1">{error || 'O lead solicitado não foi encontrado.'}</p>
          </div>
          <div className="pt-2">
            <Link to="/crm/leads">
              <Button className="w-full bg-brand-green hover:bg-emerald-700 text-white text-xs">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Inbox de Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawPhone = (lead.customerPhone || '').replace(/\D/g, '');
  const waUrl = rawPhone ? `https://wa.me/${rawPhone}?text=Olá%20${encodeURIComponent(lead.customerName)},%20sou%20o%20corretor%20do%20MeuPlace%20a%20respeito%20do%20imóvel%20${encodeURIComponent(lead.propertyTitle || '')}.` : null;

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <Link 
                to="/crm/leads" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-green transition-colors mb-1"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar à Inbox de Leads
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {lead.customerName}
                </h1>
                <LeadStatusBadge status={lead.status} size="lg" />
                <LeadPriorityBadge priority={lead.priority} size="md" />
              </div>
              <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                <span>Lead ID: {lead.id}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(lead.id, 'ID do Lead')}
                  className="hover:text-gray-600"
                  title="Copiar ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>

            {/* Ações Principais do Lead */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusModalOpen(true)}
                className="text-xs font-semibold border-brand-green/30 text-brand-green hover:bg-emerald-50"
              >
                Alterar Status
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPriorityModalOpen(true)}
                className="text-xs font-semibold border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                Prioridade
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsContactModalOpen(true)}
                className="text-xs font-semibold border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Registrar Contacto
              </Button>

              {canReassign && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="text-xs font-semibold"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-gray-500" />
                  Reatribuir
                </Button>
              )}

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}

              {lead.customerPhone && (
                <a
                  href={`tel:${lead.customerPhone}`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs"
                >
                  <Phone className="w-4 h-4" /> Ligar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Card Operacional: Próxima Ação Comercial (Next Action) */}
        {(() => {
          const nextAction = deriveLeadNextAction(lead, tasks, viewings);
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  nextAction.badgeVariant === 'rose' ? 'bg-rose-50 text-rose-600' :
                  nextAction.badgeVariant === 'amber' ? 'bg-amber-50 text-amber-600' :
                  nextAction.badgeVariant === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  nextAction.badgeVariant === 'blue' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Próximo Passo Comercial:</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      nextAction.badgeVariant === 'rose' ? 'bg-rose-100 text-rose-800' :
                      nextAction.badgeVariant === 'amber' ? 'bg-amber-100 text-amber-800' :
                      nextAction.badgeVariant === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                      nextAction.badgeVariant === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {nextAction.badgeText}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mt-0.5">{nextAction.title}</h4>
                  <p className="text-xs text-gray-500">{nextAction.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {nextAction.type === 'contact_needed' && (
                  <Button
                    size="sm"
                    onClick={() => setIsContactModalOpen(true)}
                    className="bg-brand-green hover:bg-emerald-700 text-white text-xs"
                  >
                    Registrar Contacto Agora
                  </Button>
                )}
                {nextAction.type === 'qualify_needed' && (
                  <Button
                    size="sm"
                    onClick={() => setIsStatusModalOpen(true)}
                    className="bg-brand-green hover:bg-emerald-700 text-white text-xs"
                  >
                    Avançar para Qualificado
                  </Button>
                )}
                {(nextAction.type === 'task_overdue' || nextAction.type === 'task_today' || nextAction.type === 'task_upcoming') && nextAction.targetId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteTask(nextAction.targetId!)}
                    className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Concluir Tarefa
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="text-xs"
                >
                  + Agendar Follow-up
                </Button>
              </div>
            </div>
          );
        })()}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Contexto do Cliente, Imóvel e Custódia */}
          <div className="space-y-6">
            {/* Cartão de Contacto do Comprador */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-brand-green" /> Dados do Contacto
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Nome Completo:</span>
                  <span className="font-semibold text-gray-900">{lead.customerName}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block">Telefone:</span>
                  <div className="flex items-center justify-between font-mono font-medium text-gray-900">
                    <span>{lead.customerPhone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(lead.customerPhone, 'Telefone')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {lead.customerEmail && (
                  <div>
                    <span className="text-xs text-gray-400 block">Email:</span>
                    <div className="flex items-center justify-between text-xs text-gray-800 break-all">
                      <span>{lead.customerEmail}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.customerEmail || '', 'Email')}
                        className="text-gray-400 hover:text-gray-600 shrink-0 ml-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {lead.message && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400 block mb-1">Mensagem Inicial do Cliente:</span>
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 italic border border-gray-100 leading-relaxed">
                      "{lead.message}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cartão do Imóvel de Interesse */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-green" /> Imóvel de Interesse
                </h3>
                <Link
                  to={`/properties/${lead.propertyId}`}
                  target="_blank"
                  className="text-xs text-brand-green hover:underline flex items-center gap-1 font-semibold"
                >
                  Ver Anúncio <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {property ? (
                <div className="space-y-3">
                  {property.images && property.images.length > 0 && (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-36 object-cover rounded-lg border border-gray-100"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{property.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{property.location?.city || property.location?.address || 'Moçambique'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-500">Valor Anunciado:</span>
                    <span className="font-bold text-brand-green text-sm">
                      {property.price?.toLocaleString()} {property.currency || 'MZN'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 text-sm">{lead.propertyTitle || 'Imóvel sem título'}</p>
                  <p className="text-xs font-mono text-gray-400">ID: {lead.propertyId}</p>
                </div>
              )}
            </div>

            {/* Cartão de Relacionamento e Custódia */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-green" /> Custódia & Responsabilidade
              </h3>

              <div className="text-xs space-y-2 text-gray-600 divide-y divide-gray-100">
                <div className="pt-1 flex justify-between items-center">
                  <span>Custódia Primária (Proprietário):</span>
                  <span className="font-mono text-gray-900 font-semibold">{lead.propertyOwnerId.slice(0, 10)}...</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span>Custódia Operacional (Agente):</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    {lead.agentId ? `${lead.agentId.slice(0, 10)}...` : 'Não atribuído'}
                  </span>
                </div>
                {lead.agencyId && (
                  <div className="pt-2 flex justify-between items-center">
                    <span>Imobiliária:</span>
                    <span className="font-mono text-gray-900">{lead.agencyId}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-between items-center text-gray-400 text-[11px]">
                  <span>Criado em:</span>
                  <span>{formatActivityDate(lead.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Cartão de Visitas Relacionadas ao Lead */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-green" /> Visitas Agendadas ({viewings.length})
                </h3>
              </div>

              {viewings.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 italic text-center">Nenhuma visita vinculada a este lead.</p>
              ) : (
                <div className="space-y-2.5 divide-y divide-gray-100">
                  {viewings.map((v) => (
                    <div key={v.id} className="pt-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {v.preferredDate} às {v.preferredTime}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          v.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          v.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                          v.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      {v.notes && <p className="text-gray-500 italic">"{v.notes}"</p>}

                      {/* Transição rápida de visita se pendente */}
                      {v.status === 'pending' && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateViewingStatus(v.id, 'confirmed')}
                            className="h-6 text-[10px] text-emerald-700 hover:bg-emerald-50"
                          >
                            <CalendarCheck className="w-3 h-3 mr-1" /> Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateViewingStatus(v.id, 'cancelled')}
                            className="h-6 text-[10px] text-rose-600 hover:bg-rose-50"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Tarefas e Timeline Comercial */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bloco de Tarefas de Follow-up */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-brand-green" /> Tarefas de Follow-up ({tasks.length})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Lembretes e ações de atendimento associados a este lead.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="bg-brand-green hover:bg-emerald-700 text-white text-xs gap-1.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Tarefa
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500">Nenhuma tarefa pendente para este lead.</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsTaskModalOpen(true)}
                    className="text-xs text-brand-green font-semibold mt-1"
                  >
                    + Adicionar o primeiro lembrete de follow-up
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tasks.map((task) => (
                    <div key={task.id} className="py-3 flex items-start justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            task.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                            task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            task.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-600 leading-relaxed">{task.description}</p>
                        )}
                        <div className="text-[11px] text-gray-400 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Prazo: {task.dueAt?.replace('T', ' ')}
                          </span>
                          <span>Atribuído: <strong className="font-mono text-gray-600">{task.assignedTo.slice(0, 8)}...</strong></span>
                        </div>
                      </div>

                      {task.status === 'pending' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCompleteTask(task.id)}
                            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
                            title="Marcar como concluída"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Concluir
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelTask(task.id)}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                            title="Cancelar tarefa"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adicionar Anotação Comercial */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-green" /> Nova Nota Comercial (Timeline Imutável)
              </h3>
              <form onSubmit={handleAddNote} className="space-y-3">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Registre o resumo do contacto, objeções levantadas pelo cliente ou acordos verbais..."
                  rows={3}
                  maxLength={2000}
                  className="text-xs sm:text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {noteText.length}/2000 caracteres · Registrado com seu usuário
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingNote || noteText.trim().length < 3}
                    className="bg-brand-green hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    {savingNote ? 'Salvando...' : 'Adicionar Nota à Timeline'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Timeline Comercial Append-Only */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Histórico & Timeline Comercial
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registro cronológico append-only de interações comerciais (não inclui telemetria de tráfego).
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {activities.length} eventos
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">
                  Nenhuma atividade comercial registrada nesta timeline.
                </div>
              ) : (
                <div className="pt-2">
                  {activities.map((activity, idx) => (
                    <LeadTimelineItem
                      key={activity.id}
                      activity={activity}
                      isLast={idx === activities.length - 1}
                    />
                  ))}

                  {/* Carregar mais atividades */}
                  {activitiesHasMore && (
                    <div className="pt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMoreActivities}
                        disabled={loadingMoreActivities}
                        className="text-xs font-medium"
                      >
                        {loadingMoreActivities ? (
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Carregando mais...
                          </span>
                        ) : (
                          'Carregar Atividades Anteriores'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modais de Ação */}
      {lead && (
        <>
          <LeadStatusModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            leadId={lead.id}
            currentStatus={lead.status}
            onStatusUpdated={(newStatus) => {
              setLead(prev => prev ? { ...prev, status: newStatus } : null);
              fetchLeadDetails();
            }}
          />

          <LeadAssignModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            leadId={lead.id}
            currentAgentId={lead.agentId}
            propertyOwnerId={lead.propertyOwnerId}
            onAssigned={(newAgentId) => {
              setLead(prev => prev ? { ...prev, agentId: newAgentId } : null);
              fetchLeadDetails();
            }}
          />

          <LeadTaskCreateModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            leadId={lead.id}
            propertyId={lead.propertyId}
            defaultAssignedTo={lead.agentId || currentUser?.uid || ''}
            onTaskCreated={() => {
              fetchLeadDetails();
            }}
          />

          <LeadPriorityModal
            isOpen={isPriorityModalOpen}
            onClose={() => setIsPriorityModalOpen(false)}
            leadId={lead.id}
            currentPriority={lead.priority}
            onPriorityUpdated={(newPriority) => {
              setLead(prev => prev ? { ...prev, priority: newPriority } : null);
              fetchLeadDetails();
            }}
          />

          <LeadContactModal
            isOpen={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            leadId={lead.id}
            propertyId={lead.propertyId}
            customerName={lead.customerName}
            customerPhone={lead.customerPhone}
            customerEmail={lead.customerEmail}
            onContactLogged={() => {
              fetchLeadDetails();
            }}
          />
        </>
      )}
    </div>
  );
}
