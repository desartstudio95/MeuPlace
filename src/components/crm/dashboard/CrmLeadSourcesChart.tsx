import React from 'react';
import { LeadSourceStat } from '@/services/crmAnalyticsService';
import { 
  MessageSquare, 
  Phone, 
  FileText, 
  Eye, 
  Globe, 
  HelpCircle,
  Share2
} from 'lucide-react';

interface CrmLeadSourcesChartProps {
  sources: LeadSourceStat[];
  totalLeads: number;
}

export function CrmLeadSourcesChart({ sources, totalLeads }: CrmLeadSourcesChartProps) {
  const getSourceIcon = (sourceKey: string) => {
    switch (sourceKey) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'contact_form':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'viewing_request':
        return <Eye className="w-4 h-4 text-purple-600" />;
      case 'website':
        return <Globe className="w-4 h-4 text-teal-600" />;
      case 'referral':
        return <Share2 className="w-4 h-4 text-amber-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSourceColor = (index: number) => {
    const palette = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-rose-500',
      'bg-gray-400'
    ];
    return palette[index % palette.length];
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Origens dos Leads (Canais)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Distribuição dos canais reais de captura no período ({totalLeads} total).
          </p>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-xs">
          Nenhuma origem de lead registrada no período.
        </div>
      ) : (
        <div className="space-y-3.5">
          {sources.map((item, idx) => {
            const pct = item.percentage ?? 0;
            return (
              <div key={item.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(item.source)}
                    <span className="font-semibold text-gray-800">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{item.count}</span>
                    <span className="text-gray-400 text-[11px]">
                      ({item.percentage !== null ? `${item.percentage}%` : '--'})
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getSourceColor(idx)} transition-all duration-500`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
