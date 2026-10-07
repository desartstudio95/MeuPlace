import React from 'react';
import { Property, PropertyReport } from '@/types';
import { calculatePropertyHealth } from '@/utils/propertyHealth';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PropertyHealthBadgeProps {
  property: Property;
  reports?: PropertyReport[];
  className?: string;
}

export const PropertyHealthBadge: React.FC<PropertyHealthBadgeProps> = ({
  property,
  reports = [],
  className = ''
}) => {
  const health = calculatePropertyHealth(property, reports);

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  const IconComponent = {
    emerald: CheckCircle2,
    blue: Activity,
    amber: AlertTriangle,
    rose: ShieldAlert
  }[health.badgeVariant];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${variantStyles[health.badgeVariant]} ${className}`}
      title={`Saúde: ${health.healthScore}/100 · ${health.issues.length} alertas`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{health.badgeLabel}</span>
      <span className="text-gray-400">·</span>
      <span className="font-semibold">{health.healthScore}%</span>
    </div>
  );
};
