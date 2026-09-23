import React from 'react';
import { LeadActivity, LeadActivityType } from '@/types';
import { 
  UserPlus, 
  PhoneCall, 
  ArrowRightCircle, 
  FileText, 
  Phone, 
  MessageSquare, 
  Mail, 
  Calendar, 
  CalendarCheck, 
  CheckCircle2, 
  CalendarX, 
  PlusCircle, 
  CheckSquare, 
  UserCheck, 
  RefreshCw, 
  Trophy, 
  XCircle,
  HelpCircle,
  Flag
} from 'lucide-react';

interface LeadTimelineItemProps {
  activity: LeadActivity;
  isLast?: boolean;
}

export function formatActivityDate(createdAt: any): string {
  if (!createdAt) return 'Data não registrada';
  
  let date: Date;
  if (createdAt && typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    date = new Date(createdAt);
  } else {
    return 'Agora mesmo';
  }

  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

const ACTIVITY_TYPE_CONFIG: Record<LeadActivityType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}> = {
  lead_created: {
    label: 'Lead Criado',
    icon: UserPlus,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  lead_contacted: {
    label: 'Contacto Realizado',
    icon: PhoneCall,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  status_changed: {
    label: 'Mudança de Estado',
    icon: ArrowRightCircle,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  note_added: {
    label: 'Nota Comercial',
    icon: FileText,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  call_logged: {
    label: 'Chamada Telefónica',
    icon: Phone,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600'
  },
  whatsapp_sent: {
    label: 'Mensagem WhatsApp',
    icon: MessageSquare,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  email_sent: {
    label: 'Email Enviado',
    icon: Mail,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  viewing_requested: {
    label: 'Visita Solicitada',
    icon: Calendar,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  viewing_confirmed: {
    label: 'Visita Confirmada',
    icon: CalendarCheck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  viewing_completed: {
    label: 'Visita Concluída',
    icon: CheckCircle2,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  viewing_cancelled: {
    label: 'Visita Cancelada',
    icon: CalendarX,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600'
  },
  task_created: {
    label: 'Tarefa Agendada',
    icon: PlusCircle,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  task_completed: {
    label: 'Tarefa Concluída',
    icon: CheckSquare,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  assigned: {
    label: 'Lead Atribuído',
    icon: UserCheck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  reassigned: {
    label: 'Lead Reatribuído',
    icon: RefreshCw,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  priority_changed: {
    label: 'Prioridade Alterada',
    icon: Flag,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700'
  },
  converted: {
    label: 'Negócio Ganho',
    icon: Trophy,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-700'
  },
  lost: {
    label: 'Lead Perdido',
    icon: XCircle,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600'
  }
};

const ACTOR_ROLE_LABELS: Record<string, string> = {
  agent: 'Corretor',
  owner: 'Proprietário',
  customer: 'Comprador',
  system: 'Sistema MeuPlace',
  admin: 'Administrador'
};

export function LeadTimelineItem({ activity, isLast = false }: LeadTimelineItemProps) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type] || {
    label: activity.type,
    icon: HelpCircle,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600'
  };

  const Icon = config.icon;
  const actorRoleLabel = ACTOR_ROLE_LABELS[activity.actorRole] || activity.actorRole;

  return (
    <div className="relative flex gap-4 pb-6 group" data-testid={`activity-${activity.id || 'item'}`}>
      {/* Timeline line */}
      {!isLast && (
        <span
          className="absolute left-4 top-8 -bottom-1 w-0.5 bg-gray-200 group-hover:bg-gray-300 transition-colors"
          aria-hidden="true"
        />
      )}

      {/* Icon node */}
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor} shadow-xs border border-white ring-2 ring-gray-100`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content box */}
      <div className="flex-1 min-w-0 bg-white p-3 rounded-lg border border-gray-100 hover:border-gray-200 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-900">{activity.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
              {config.label}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-normal shrink-0">
            {formatActivityDate(activity.createdAt)}
          </span>
        </div>

        {activity.description && (
          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Metadata display */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {activity.metadata.fromStatus && activity.metadata.toStatus && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono">
                {activity.metadata.fromStatus} → {activity.metadata.toStatus}
              </span>
            )}
            {activity.metadata.channel && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                Canal: <strong className="font-medium text-gray-800">{activity.metadata.channel}</strong>
              </span>
            )}
            {activity.metadata.assignedTo && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                Responsável: <strong className="font-mono text-gray-800">{activity.metadata.assignedTo}</strong>
              </span>
            )}
          </div>
        )}

        {/* Actor footer */}
        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
          <span>
            Por: <strong className="text-gray-700 font-medium">{activity.actorName || 'Usuário'}</strong>
            {' · '}
            <span className="text-gray-500">{actorRoleLabel}</span>
          </span>
          <span className="text-[10px] text-gray-300 font-mono">Imutável</span>
        </div>
      </div>
    </div>
  );
}
