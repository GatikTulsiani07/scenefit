import { catalogItemSchema, type Catalog, type CatalogItem, type DigitalAssetStatus, type PublicationStatus } from './contracts';

export type CatalogItemFormValues = {
  name: string;
  description: string;
  sku: string;
  category: string;
  productType: string;
  pricingType: CatalogItem['pricing']['type'];
  currency: string;
  amount: string;
  width: string;
  height: string;
  depth: string;
  publicationStatus: PublicationStatus;
  digitalAssetStatus: DigitalAssetStatus;
};

export type CatalogItemFieldErrors = Partial<Record<keyof CatalogItemFormValues | 'form', string>>;

export const newCatalogItemDefaults: CatalogItemFormValues = {
  name: '',
  description: '',
  sku: '',
  category: '',
  productType: 'Product',
  pricingType: 'custom_quote',
  currency: 'USD',
  amount: '',
  width: '',
  height: '',
  depth: '',
  publicationStatus: 'draft',
  digitalAssetStatus: 'no_asset',
};

export function getNewCatalogItemFormValues(): CatalogItemFormValues {
  return { ...newCatalogItemDefaults };
}

export function getCatalogItemFormValues(item: CatalogItem): CatalogItemFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    sku: item.sku ?? '',
    category: item.category,
    productType: typeof item.metadata?.productType === 'string' ? item.metadata.productType : 'Product',
    pricingType: item.pricing.type,
    currency: 'currency' in item.pricing ? item.pricing.currency : 'USD',
    amount: 'amount' in item.pricing ? String(item.pricing.amount) : '',
    width: item.dimensions ? String(item.dimensions.width) : '',
    height: item.dimensions ? String(item.dimensions.height) : '',
    depth: item.dimensions ? String(item.dimensions.depth) : '',
    publicationStatus: item.publicationStatus,
    digitalAssetStatus: item.digitalAsset?.status ?? 'no_asset',
  };
}

export function findCatalogItemById(catalog: Catalog, id: string): CatalogItem | undefined {
  return catalog.items.find((item) => item.id === id);
}

export function hasCatalogItemFormChanges(
  initialValues: CatalogItemFormValues,
  currentValues: CatalogItemFormValues,
): boolean {
  return (Object.keys(initialValues) as Array<keyof CatalogItemFormValues>).some(
    (key) => initialValues[key] !== currentValues[key],
  );
}

function parseOptionalDimension(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  return Number(value);
}

export function buildCatalogItemPayload(
  values: CatalogItemFormValues,
  options: { id: string; catalogId: string; existingItem?: CatalogItem },
): unknown {
  const pricing = values.pricingType === 'custom_quote' || values.pricingType === 'hidden'
    ? { type: values.pricingType }
    : { type: values.pricingType, amount: Number(values.amount), currency: values.currency.trim().toUpperCase() };

  const width = parseOptionalDimension(values.width);
  const height = parseOptionalDimension(values.height);
  const depth = parseOptionalDimension(values.depth);
  const hasDimensions = width !== undefined || height !== undefined || depth !== undefined;
  const existingDigitalAsset = options.existingItem?.digitalAsset;
  const existingMetadata = options.existingItem?.metadata ?? {};

  return {
    id: options.existingItem?.id ?? options.id,
    catalogId: options.catalogId,
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    sku: values.sku.trim() || undefined,
    category: values.category.trim(),
    publicationStatus: values.publicationStatus,
    pricing,
    ...(hasDimensions ? { dimensions: { width, height, depth, unit: 'm' } } : {}),
    digitalAsset: existingDigitalAsset
      ? { ...existingDigitalAsset, status: values.digitalAssetStatus }
      : { status: values.digitalAssetStatus },
    metadata: { ...existingMetadata, productType: values.productType.trim() },
  };
}

export function validateCatalogItemForm(
  values: CatalogItemFormValues,
  options: { id: string; catalogId: string; existingItem?: CatalogItem },
): { success: true; payload: CatalogItem } | { success: false; fieldErrors: CatalogItemFieldErrors } {
  const fieldErrors: CatalogItemFieldErrors = {};

  if (!values.name.trim()) fieldErrors.name = 'Product name is required.';
  if (!values.category.trim()) fieldErrors.category = 'Category is required.';
  if (!values.productType.trim()) fieldErrors.productType = 'Product type is required.';

  if (values.pricingType !== 'custom_quote' && values.pricingType !== 'hidden') {
    if (!values.currency.trim()) fieldErrors.currency = 'Currency is required for priced products.';
    if (!values.amount.trim()) fieldErrors.amount = 'Amount is required for this pricing type.';
  }

  const hasDimensions = [values.width, values.height, values.depth].some((value) => value.trim() !== '');
  const hasMissingDimension = [values.width, values.height, values.depth].some((value) => value.trim() === '');
  if (hasDimensions && hasMissingDimension) {
    fieldErrors.width = fieldErrors.height = fieldErrors.depth = 'Enter width, height, and depth together, or leave all three blank.';
  }

  if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors };

  const parsed = catalogItemSchema.safeParse(buildCatalogItemPayload(values, options));
  if (parsed.success) return { success: true, payload: parsed.data };

  for (const issue of parsed.error.issues) {
    const path = issue.path.join('.');
    const field = path === 'pricing.amount'
      ? 'amount'
      : path === 'pricing.currency'
        ? 'currency'
        : path.startsWith('dimensions.')
          ? path.split('.')[1]
          : issue.path[0];
    if (typeof field === 'string' && field in newCatalogItemDefaults && !fieldErrors[field as keyof CatalogItemFormValues]) {
      fieldErrors[field as keyof CatalogItemFormValues] = issue.message;
    }
  }

  fieldErrors.form = 'Check the highlighted fields and try again.';
  return { success: false, fieldErrors };
}
