import React from 'react';
import { BusinessDashboard } from '@/features/business/dashboard';
import { populatedDashboardViewModel } from '@/features/business/dashboard-view-model';

export default function DashboardPage() {
  return <BusinessDashboard viewModel={populatedDashboardViewModel} />;
}
