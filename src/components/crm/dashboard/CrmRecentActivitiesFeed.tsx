import React from 'react';
import { LeadActivity } from '@/types';
import { formatDateTimeMozambique } from '@/utils/crmDateUtils';
import { 
  Activity, 
  MessageSquare, 
  Phone, 
  Mail, 
  CheckSquare, 
  Trophy, 
  XCircle, 
  Tag, 
  User, 
  Eye, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CrmRecentActivitiesFeedProps {
  activities: LeadActivity[];
}

export function CrmRecentActivitiesFeed({ activities }: CrmRecentActivitiesFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_contacted':
      case 'call_logged':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'whatsapp_sent':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'email_sent':
        return <Mail className="w-3.5 h-3.5 text-indigo-600" />;
      case 'task_created':
      case 'task_completed':
        return <CheckSquare className="w-3.5 h-3.5 text-amber-600" />;
      case 'converted':
        return <Trophy className="w-3.5 h-3.5 text-emerald-700" />;
      case 'lost':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'viewing_requested':
      case 'viewing_confirmed':
      case 'viewing_completed':
        return <Eye className="w-3.5 h-3.5 text-purple-600" />;
      case 'status_changed':
      case 'priority_changed':
        return <Tag className="w-3.5 h-3.5 text-blue-500" />;
      case 'assigned':
      case 'reassigned':
        return <User className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-green" />
            Atividades Comerciais Recentes
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Registro cronológico das últimas ações registradas na timeline de leads (lead_activities).
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs">
          Nenhuma atividade comercial registrada recentemente.
        </div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto pr-1">
          {activities.map((act) => (
            <div key={act.id || act.createdAt} className="py-2.5 flex items-start gap-3 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {act.title}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatDateTimeMozambique(act.createdAt)}
                  </span>
                </div>
                {act.description && (
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {act.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">
                    Por: <strong className="text-gray-600">{act.actorName || act.actorRole}</strong>
                  </span>
                  {act.leadId && (
                    <Link
                      to={`/crm/leads/${act.leadId}`}
                      className="text-[10px] font-semibold text-brand-green hover:underline inline-flex items-center gap-0.5 ml-auto"
                    >
                      Ver Lead <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
