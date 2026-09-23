import React from 'react';
import { LeadStatus } from '@/types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  new: {
    label: 'Novo',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  contacted: {
    label: 'Contactado',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500'
  },
  qualified: {
    label: 'Qualificado',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500'
  },
  negotiating: {
    label: 'Em Negociação',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  won: {
    label: 'Ganho',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  lost: {
    label: 'Perdido',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  archived: {
    label: 'Arquivado',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400'
  }
};

export function LeadStatusBadge({ status, size = 'md', className = '' }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      data-testid={`lead-status-${status}`}
    >
      <span className={`rounded-full shrink-0 ${size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'} ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
