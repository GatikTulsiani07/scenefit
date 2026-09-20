import React from 'react';

import { CatalogItemForm } from '@/features/catalog/catalog-item-form';
import { SEEDED_FURNITURE_CATALOG_ID } from '@/features/catalog/legacy-furniture-adapter';

export default function NewCatalogItemPage() {
  return <CatalogItemForm mode="new" catalogId={SEEDED_FURNITURE_CATALOG_ID} />;
}
