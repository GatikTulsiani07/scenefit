export type DashboardAssetStatus = 'no_asset' | 'processing' | 'ready' | 'failed';

export type DashboardCatalogItem = {
  id: string;
  assetStatus: DashboardAssetStatus;
};

export type DashboardVisualization = {
  id: string;
  name: string;
  spaceLabel: string;
  updatedLabel: string;
};

export type DashboardCustomerRequest = {
  id: string;
  customerName: string;
  visualizationName: string;
  requestType: string;
  receivedLabel: string;
};

export type DashboardBusiness = {
  name: string;
  summary: string;
};

export type DashboardMetrics = {
  totalProducts: number;
  readyDigitalAssets: number;
  visualizationsCreated: number;
  customerRequestsReceived: number;
};

type DashboardData = {
  business: DashboardBusiness;
  catalogItems: ReadonlyArray<DashboardCatalogItem>;
  visualizations: ReadonlyArray<DashboardVisualization>;
  customerRequests: ReadonlyArray<DashboardCustomerRequest>;
};

export type DashboardViewModel =
  | ({ state: 'populated' } & DashboardData)
  | ({ state: 'empty' } & DashboardData)
  | { state: 'loading'; business: DashboardBusiness }
  | { state: 'error'; business: DashboardBusiness; message: string };

export const demoBusiness: DashboardBusiness = {
  name: 'Northstar Studio',
  summary: 'A visual-commerce workspace for bringing your catalogue into customer spaces.',
};

export const populatedDashboardViewModel = {
  state: 'populated',
  business: demoBusiness,
  catalogItems: [
    { id: 'catalog-item-1', assetStatus: 'ready' },
    { id: 'catalog-item-2', assetStatus: 'ready' },
    { id: 'catalog-item-3', assetStatus: 'ready' },
    { id: 'catalog-item-4', assetStatus: 'ready' },
    { id: 'catalog-item-5', assetStatus: 'processing' },
    { id: 'catalog-item-6', assetStatus: 'no_asset' },
  ],
  visualizations: [
    {
      id: 'visualization-1',
      name: 'Harbor welcome area',
      spaceLabel: 'Hospitality space',
      updatedLabel: 'Updated today',
    },
    {
      id: 'visualization-2',
      name: 'Riverside workspace',
      spaceLabel: 'Office space',
      updatedLabel: 'Updated yesterday',
    },
    {
      id: 'visualization-3',
      name: 'North Gallery display',
      spaceLabel: 'Retail space',
      updatedLabel: 'Updated 3 days ago',
    },
  ],
  customerRequests: [
    {
      id: 'request-1',
      customerName: 'Jordan Lee',
      visualizationName: 'Harbor welcome area',
      requestType: 'Quote request',
      receivedLabel: 'Received today',
    },
    {
      id: 'request-2',
      customerName: 'Avery Morgan',
      visualizationName: 'Riverside workspace',
      requestType: 'Consultation request',
      receivedLabel: 'Received yesterday',
    },
  ],
} satisfies DashboardViewModel;

export const emptyDashboardViewModel = {
  state: 'empty',
  business: demoBusiness,
  catalogItems: [],
  visualizations: [],
  customerRequests: [],
} satisfies DashboardViewModel;

export const loadingDashboardViewModel = {
  state: 'loading',
  business: demoBusiness,
} satisfies DashboardViewModel;

export const errorDashboardViewModel = {
  state: 'error',
  business: demoBusiness,
  message: 'The dashboard demo could not be displayed. Your workspace links are still available.',
} satisfies DashboardViewModel;

export function getDashboardMetrics(data: DashboardData): DashboardMetrics {
  return {
    totalProducts: data.catalogItems.length,
    readyDigitalAssets: data.catalogItems.filter((item) => item.assetStatus === 'ready').length,
    visualizationsCreated: data.visualizations.length,
    customerRequestsReceived: data.customerRequests.length,
  };
}
