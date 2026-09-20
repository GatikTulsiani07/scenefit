import React from 'react';

import { CatalogItemForm } from '@/features/catalog/catalog-item-form';
import { findCatalogItemById } from '@/features/catalog/catalog-item-form-data';
import { adaptSeededFurnitureCatalogue } from '@/features/catalog/legacy-furniture-adapter';

export default async function CatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = adaptSeededFurnitureCatalogue();
  const item = findCatalogItemById(catalog, id);

  return <CatalogItemForm mode="edit" catalogId={catalog.id} item={item} state={item ? 'ready' : 'not_found'} />;
}
