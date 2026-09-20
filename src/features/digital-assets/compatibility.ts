import type { CatalogItem, DigitalAssetReference } from '@/features/catalog/contracts';

export type LegacyDigitalAssetMapping =
  {
    kind: 'unmapped';
    reason: 'no_asset_status' | 'missing_approved_file_reference' | 'missing_business_scope';
    legacyReference?: DigitalAssetReference;
  };

/**
 * Legacy CatalogItem references do not contain enough evidence to create a
 * verified DigitalAsset. In particular, a path on a `no_asset` reference is
 * retained for compatibility but never promoted to an asset or `ready`. A
 * boolean assertion from a caller is intentionally not accepted as evidence;
 * a future adapter must provide and validate the actual approved file record,
 * ownership scope, and timestamps before it can create a DigitalAsset.
 */
export function mapCatalogItemDigitalAssetReference(
  item: CatalogItem,
  options?: { businessId?: string },
): LegacyDigitalAssetMapping {
  const reference = item.digitalAsset;

  if (!reference || reference.status === 'no_asset') {
    return { kind: 'unmapped', reason: 'no_asset_status', legacyReference: reference };
  }

  if (!options?.businessId) {
    return { kind: 'unmapped', reason: 'missing_business_scope', legacyReference: reference };
  }

  return { kind: 'unmapped', reason: 'missing_approved_file_reference', legacyReference: reference };
}
