'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ImagePlus } from 'lucide-react';

import type { CatalogItem } from './contracts';
import {
  getCatalogItemFormValues,
  getNewCatalogItemFormValues,
  hasCatalogItemFormChanges,
  validateCatalogItemForm,
  type CatalogItemFieldErrors,
  type CatalogItemFormValues,
} from './catalog-item-form-data';

export type CatalogItemFormState = 'ready' | 'loading' | 'error' | 'not_found';
type SubmitResult = { success: true; payload: CatalogItem } | { success: false; message: string };
type SubmitCatalogItem = (payload: CatalogItem) => SubmitResult | Promise<SubmitResult>;
export const submitAdapterFailureMessage = 'Unable to prepare the catalogue payload. Try again.';

type CatalogItemFormProps = {
  mode: 'new' | 'edit';
  item?: CatalogItem;
  state?: CatalogItemFormState;
  errorMessage?: string;
  onSubmit?: SubmitCatalogItem;
  catalogId: string;
};

function developmentSubmit(payload: CatalogItem): SubmitResult {
  return { success: true, payload };
}

export async function submitCatalogItemSafely(
  onSubmit: SubmitCatalogItem,
  payload: CatalogItem,
): Promise<SubmitResult> {
  try {
    return await onSubmit(payload);
  } catch {
    return { success: false, message: submitAdapterFailureMessage };
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1 text-sm text-red-700" role="alert">{message}</p> : null;
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">{children} <span aria-hidden="true" className="text-red-700">*</span><span className="sr-only">required</span></label>;
}

function TextField({ id, label, value, onChange, error, required = false, type = 'text', placeholder }: { id: keyof CatalogItemFormValues; label: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean; type?: string; placeholder?: string }) {
  const errorId = `${id}-error`;
  return <div><>{required ? <RequiredLabel htmlFor={id}>{label}</RequiredLabel> : <label htmlFor={id} className="text-sm font-medium text-slate-800">{label}</label>}</><input id={id} name={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700" /> <FieldError id={errorId} message={error} /></div>;
}

function SelectField({ id, label, value, onChange, children }: { id: keyof CatalogItemFormValues; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="text-sm font-medium text-slate-800">{label}</label><select id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">{children}</select></div>;
}

export function CatalogItemForm({ mode, item, state = 'ready', errorMessage = 'The product form could not be loaded. Try again later.', onSubmit = developmentSubmit, catalogId }: CatalogItemFormProps) {
  const initialValues = item ? getCatalogItemFormValues(item) : getNewCatalogItemFormValues();
  const [values, setValues] = useState<CatalogItemFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<CatalogItemFieldErrors>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const isDirty = hasCatalogItemFormChanges(initialValues, values);

  if (state === 'loading') return <div role="status" aria-live="polite" className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8"><p className="text-lg font-semibold">Loading product form</p><p className="mt-2 text-slate-600">Preparing the product details.</p></div>;
  if (state === 'error') return <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-950"><h1 className="text-2xl font-semibold">Product form unavailable</h1><p className="mt-2">{errorMessage}</p><Link href="/catalog" className="mt-5 inline-flex rounded-md border border-red-300 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Back to Product Library</Link></div>;
  if (state === 'not_found' || (mode === 'edit' && !item)) return <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-stone-300 bg-white p-8"><h1 className="text-2xl font-semibold">Product not found</h1><p className="mt-2 text-slate-600">This product is not available in the demo catalogue.</p><Link href="/catalog" className="mt-5 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">Back to Product Library</Link></div>;

  const update = (key: keyof CatalogItemFormValues, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('idle');
    setSubmitMessage('');
    setFieldErrors({});
    const result = validateCatalogItemForm(values, { id: item?.id ?? 'new-catalog-item', catalogId, existingItem: item });
    if (!result.success) {
      setFieldErrors(result.fieldErrors);
      setSubmitState('error');
      return;
    }
    setSubmitState('submitting');
    const submission = await submitCatalogItemSafely(onSubmit, result.payload);
    if (submission.success) {
      setSubmitState('success');
      setSubmitMessage('Valid payload prepared. Nothing has been permanently saved.');
    } else {
      setSubmitState('error');
      setSubmitMessage(submission.message);
    }
  };

  const dimensionsError = fieldErrors.width ?? fieldErrors.height ?? fieldErrors.depth;
  return <div className="mx-auto max-w-4xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><ArrowLeft aria-hidden="true" className="size-4" />Back to Product Library</Link><p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Catalogue item</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{mode === 'edit' ? 'Edit product' : 'Add product'}</h1></div>{isDirty ? <p className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900" role="status">Unsaved changes</p> : null}</div>
    <div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">This form prepares a valid catalogue payload for the next step. Submission does not permanently save changes yet.</div>
    {fieldErrors.form ? <p role="alert" className="mt-4 text-sm text-red-700">{fieldErrors.form}</p> : null}
    {submitMessage ? <p role={submitState === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-lg p-3 text-sm ${submitState === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{submitState === 'success' ? <CheckCircle2 aria-hidden="true" className="mr-2 inline size-4" /> : null}{submitMessage}</p> : null}
    <form className="mt-6 space-y-6" onSubmit={submit} noValidate><section aria-labelledby="details-heading" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 id="details-heading" className="text-xl font-semibold">Product details</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><TextField id="name" label="Product name" value={values.name} onChange={(value) => update('name', value)} error={fieldErrors.name} required placeholder="e.g. Display package" /></div><div className="sm:col-span-2"><TextField id="description" label="Description" value={values.description} onChange={(value) => update('description', value)} error={fieldErrors.description} placeholder="Describe this offering" /></div><TextField id="sku" label="SKU or reference" value={values.sku} onChange={(value) => update('sku', value)} error={fieldErrors.sku} placeholder="Optional reference" /><TextField id="category" label="Category" value={values.category} onChange={(value) => update('category', value)} error={fieldErrors.category} required placeholder="e.g. Displays" /><TextField id="productType" label="Product type" value={values.productType} onChange={(value) => update('productType', value)} error={fieldErrors.productType} required placeholder="e.g. Product or service" /></div></section>
      <section aria-labelledby="pricing-heading" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 id="pricing-heading" className="text-xl font-semibold">Pricing</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><SelectField id="pricingType" label="Pricing type" value={values.pricingType} onChange={(value) => update('pricingType', value)}><option value="fixed">Fixed price</option><option value="starting_from">Starting from</option><option value="custom_quote">Custom quote</option><option value="hidden">Hidden</option></SelectField>{values.pricingType === 'fixed' || values.pricingType === 'starting_from' ? <><TextField id="currency" label="Currency" value={values.currency} onChange={(value) => update('currency', value)} error={fieldErrors.currency} required placeholder="USD" /><TextField id="amount" label="Amount" value={values.amount} onChange={(value) => update('amount', value)} error={fieldErrors.amount} required type="number" placeholder="0.00" /></> : <p className="rounded-lg bg-stone-50 p-3 text-sm leading-6 text-slate-600">No amount is required for this pricing type.</p>}</div></section>
      <section aria-labelledby="dimensions-heading" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 id="dimensions-heading" className="text-xl font-semibold">Dimensions <span className="text-sm font-normal text-slate-500">(optional, metres)</span></h2><p className="mt-2 text-sm text-slate-600">Enter all three measurements together, or leave them blank.</p><div className="mt-5 grid gap-5 sm:grid-cols-3"><TextField id="width" label="Width" value={values.width} onChange={(value) => update('width', value)} error={dimensionsError} type="number" placeholder="0.00" /><TextField id="height" label="Height" value={values.height} onChange={(value) => update('height', value)} error={dimensionsError} type="number" placeholder="0.00" /><TextField id="depth" label="Depth" value={values.depth} onChange={(value) => update('depth', value)} error={dimensionsError} type="number" placeholder="0.00" /></div></section>
      <section aria-labelledby="status-heading" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 id="status-heading" className="text-xl font-semibold">Publishing and assets</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><SelectField id="publicationStatus" label="Publication status" value={values.publicationStatus} onChange={(value) => update('publicationStatus', value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></SelectField><div><p className="text-sm font-medium text-slate-800">Digital-asset status</p><p className="mt-2 rounded-md bg-stone-100 px-3 py-2 text-sm text-slate-700">{values.digitalAssetStatus.replace('_', ' ')}</p></div></div><div aria-label="Product image placeholder" className="mt-5 flex items-center gap-4 rounded-lg border border-dashed border-stone-300 p-4"><ImagePlus aria-hidden="true" className="size-6 text-slate-500" /><div><p className="font-medium text-slate-800">Product image</p><p className="text-sm text-slate-600">Image upload is not connected yet.</p></div></div></section>
      <div className="flex flex-wrap justify-end gap-3"><Link href="/catalog" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">Cancel</Link><button type="submit" disabled={submitState === 'submitting'} className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">{submitState === 'submitting' ? 'Preparing…' : mode === 'edit' ? 'Prepare changes' : 'Prepare product'}</button></div>
    </form></div>;
}
