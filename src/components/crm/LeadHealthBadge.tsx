import React from 'react';
import { LeadHealthStatus, LeadHealthInfo } from '@/utils/crmIntelligence';
import { Activity, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface LeadHealthBadgeProps {
  status?: LeadHealthStatus;
  healthInfo?: LeadHealthInfo;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function LeadHealthBadge({
  status,
  healthInfo,
  size = 'md',
  showIcon = true
}: LeadHealthBadgeProps) {
  const resolvedStatus: LeadHealthStatus = healthInfo?.status || status || 'healthy';
  const label = healthInfo?.label || (
    resolvedStatus === 'healthy' ? 'Ativo e Saudável' :
    resolvedStatus === 'attention' ? 'Atenção Necessária' :
    'Parado (Stale)'
  );
  const reason = healthInfo?.reason || '';

  const config = {
    healthy: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    },
    attention: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      dot: 'bg-amber-500'
    },
    stale: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertOctagon,
      dot: 'bg-rose-500'
    }
  }[resolvedStatus];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border ${config.bg} ${sizeClasses}`}
      title={reason || label}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
}
