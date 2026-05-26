import React from 'react';
import { MockDataAdmin } from '@/components/admin/MockDataAdmin';

export function AdminTools() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ferramentas de Mock</h1>
      </div>
      <MockDataAdmin />
    </div>
  );
}
