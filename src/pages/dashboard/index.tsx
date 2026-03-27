import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AgentDashboard } from '../AgentDashboard';
import { UserDashboard } from './UserDashboard';
import { ResortDashboard } from './ResortDashboard';
import { Navigate } from 'react-router-dom';

export function Dashboard() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile.role === 'user') {
    return <UserDashboard />;
  }

  if (userProfile.role === 'resort') {
    return <ResortDashboard />;
  }

  // Default to Agent/Agency dashboard
  return <AgentDashboard />;
}
