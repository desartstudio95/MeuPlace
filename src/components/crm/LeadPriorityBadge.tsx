import React from 'react';
import { LeadPriority } from '@/types';

interface LeadPriorityBadgeProps {
  priority?: LeadPriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const LEAD_PRIORITY_CONFIG: Record<LeadPriority, { label: string; bg: string; text: string; border: string; indicator: string }> = {
  high: {
    label: 'Alta',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    indicator: '🔴'
  },
  medium: {
    label: 'Média',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicator: '🟡'
  },
  low: {
    label: 'Baixa',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    indicator: '⚪'
  }
};

export function LeadPriorityBadge({ priority = 'medium', size = 'md', className = '' }: LeadPriorityBadgeProps) {
  const config = LEAD_PRIORITY_CONFIG[priority] || LEAD_PRIORITY_CONFIG.medium;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      data-testid={`lead-priority-${priority}`}
    >
      <span className="text-[10px] leading-none">{config.indicator}</span>
      <span>{config.label}</span>
    </span>
  );
}
