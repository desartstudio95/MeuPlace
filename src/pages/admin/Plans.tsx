import React from 'react';
import { PlansAdmin } from '@/components/admin/PlansAdmin';

export function AdminPlans() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h1>
      </div>
      <PlansAdmin />
    </div>
  );
}
