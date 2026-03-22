import React from 'react';
import { PremiumAgenciesAdmin } from '@/components/admin/PremiumAgenciesAdmin';

export function AdminAgencies() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Agências Premium</h1>
      </div>
      <PremiumAgenciesAdmin />
    </div>
  );
}
