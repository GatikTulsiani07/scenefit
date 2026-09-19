import { describe, expect, it } from 'vitest';

import {
  emptyDashboardViewModel,
  getDashboardMetrics,
  populatedDashboardViewModel,
} from './dashboard-view-model';

describe('dashboard demo view model', () => {
  it('derives deterministic metrics from its demo records', () => {
    expect(getDashboardMetrics(populatedDashboardViewModel)).toEqual({
      totalProducts: 6,
      readyDigitalAssets: 4,
      visualizationsCreated: 3,
      customerRequestsReceived: 2,
    });
  });

  it('uses zero metrics for an intentionally empty workspace', () => {
    expect(getDashboardMetrics(emptyDashboardViewModel)).toEqual({
      totalProducts: 0,
      readyDigitalAssets: 0,
      visualizationsCreated: 0,
      customerRequestsReceived: 0,
    });
  });
});
