import React from 'react';
import { adaptSeededFurnitureCatalogue } from '@/features/catalog/legacy-furniture-adapter';
import { ProductLibrary } from '@/features/catalog/product-library';

export default function CatalogPage() {
  return <ProductLibrary catalog={adaptSeededFurnitureCatalogue()} />;
}
