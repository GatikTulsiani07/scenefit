import type {
  CatalogItem,
  DigitalAssetStatus,
  Pricing,
  PublicationStatus,
} from './contracts';

export const ALL_FILTER_VALUE = 'all';

export type ProductLibraryFilters = {
  search: string;
  category: string;
  publicationStatus: PublicationStatus | typeof ALL_FILTER_VALUE;
  digitalAssetStatus: DigitalAssetStatus | typeof ALL_FILTER_VALUE;
};

export const defaultProductLibraryFilters: ProductLibraryFilters = {
  search: '',
  category: ALL_FILTER_VALUE,
  publicationStatus: ALL_FILTER_VALUE,
  digitalAssetStatus: ALL_FILTER_VALUE,
};

export function getCatalogItemDigitalAssetStatus(item: CatalogItem): DigitalAssetStatus {
  return item.digitalAsset?.status ?? 'no_asset';
}

export function getCatalogCategories(items: ReadonlyArray<CatalogItem>): string[] {
  return [...new Set(items.map((item) => item.category))].sort((left, right) => left.localeCompare(right));
}

export function filterCatalogItems(
  items: ReadonlyArray<CatalogItem>,
  filters: ProductLibraryFilters,
): CatalogItem[] {
  const normalizedSearch = filters.search.trim().toLocaleLowerCase();

  return items.filter((item) => {
    const matchesSearch = normalizedSearch.length === 0
      || [item.name, item.sku, item.category].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch));
    const matchesCategory = filters.category === ALL_FILTER_VALUE || item.category === filters.category;
    const matchesPublicationStatus = filters.publicationStatus === ALL_FILTER_VALUE
      || item.publicationStatus === filters.publicationStatus;
    const matchesDigitalAssetStatus = filters.digitalAssetStatus === ALL_FILTER_VALUE
      || getCatalogItemDigitalAssetStatus(item) === filters.digitalAssetStatus;

    return matchesSearch && matchesCategory && matchesPublicationStatus && matchesDigitalAssetStatus;
  });
}

export function formatCatalogPrice(pricing: Pricing): string {
  if (pricing.type === 'custom_quote') {
    return 'Custom quote';
  }

  if (pricing.type === 'hidden') {
    return 'Price on request';
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: pricing.currency,
  }).format(pricing.amount);

  return pricing.type === 'starting_from' ? `From ${formattedAmount}` : formattedAmount;
}

export function formatPublicationStatus(status: PublicationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDigitalAssetStatus(status: DigitalAssetStatus): string {
  return status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
