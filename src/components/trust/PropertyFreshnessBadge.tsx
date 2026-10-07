import React from 'react';
import { Property } from '@/types';
import { calculatePropertyFreshness } from '@/utils/propertyFreshness';
import { Clock, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface PropertyFreshnessBadgeProps {
  property: Property;
  className?: string;
  showIcon?: boolean;
}

export const PropertyFreshnessBadge: React.FC<PropertyFreshnessBadgeProps> = ({
  property,
  className = '',
  showIcon = true
}) => {
  const freshness = calculatePropertyFreshness(property);

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const IconComponent = {
    emerald: CheckCircle2,
    amber: Clock,
    rose: AlertCircle,
    slate: AlertTriangle
  }[freshness.badgeVariant];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${variantStyles[freshness.badgeVariant]} ${className}`}
      title={freshness.reason}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{freshness.badgeLabel}</span>
    </div>
  );
};
