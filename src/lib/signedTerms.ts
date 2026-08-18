import { PDFDocument } from 'pdf-lib';
import { supabase } from './supabase';
import { PAGE } from './pdf/invoiceTheme';

/**
 * Storage and conversion for the customer's physically signed terms.
 *
 * These live alongside the generated invoices in the same private bucket, under
 * a path derived from the invoice number. That keeps the attachment discoverable
 * without a schema change, and means it cannot be lost when an invoice is edited
 * and its metadata is rewritten.
 *
 * Everything is normalised to a single PDF per invoice, so a re-upload replaces
 * the previous one instead of leaving two files that both look current.
 */

const BUCKET = 'invoices';
const FOLDER = 'signed-terms';
const SIGNED_URL_TTL_SECONDS = 300;

/** Photos are downscaled to keep a multi-page scan a sensible size. */
const MAX_IMAGE_EDGE = 2200;
const JPEG_QUALITY = 0.82;
/** Whitespace around a photo placed on an A4 page. */
const PAGE_PADDING = 24;

export interface SignedTermsRecord {
  invoiceNumber: string;
  path: string;
  updatedAt: string;
  size: number;
}

export function signedTermsPath(invoiceNumber: string): string {
  return `${FOLDER}/${invoiceNumber}.pdf`;
}

/**
 * Every stored document, keyed by invoice number. One request covers the whole
 * table, so rows can show whether they have an attachment without a call each.
 */
export async function listSignedTerms(): Promise<Map<string, SignedTermsRecord>> {
  const byInvoice = new Map<string, SignedTermsRecord>();

  const { data, error } = await supabase.storage.from(BUCKET).list(FOLDER, { limit: 1000 });

  if (error) {
    console.error('Failed to list signed terms:', error);
    return byInvoice;
  }

  for (const object of data ?? []) {
    if (!object.name.toLowerCase().endsWith('.pdf')) continue;
    const invoiceNumber = object.name.replace(/\.pdf$/i, '');
    byInvoice.set(invoiceNumber, {
      invoiceNumber,
      path: `${FOLDER}/${object.name}`,
      updatedAt: object.updated_at ?? object.created_at ?? '',
      size: (object.metadata as { size?: number } | null)?.size ?? 0,
    });
  }

  return byInvoice;
}

export async function uploadSignedTerms(invoiceNumber: string, pdf: Blob): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(signedTermsPath(invoiceNumber), pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('Failed to upload signed terms:', error);
    return false;
  }

  return true;
}

/** Short-lived link to a stored document; the bucket is private. */
export async function getSignedTermsUrl(
  invoiceNumber: string,
  downloadAs?: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      signedTermsPath(invoiceNumber),
      SIGNED_URL_TTL_SECONDS,
      downloadAs ? { download: downloadAs } : undefined,
    );

  if (error || !data?.signedUrl) {
    console.error('Failed to create a signed terms URL:', error);
    return null;
  }

  return data.signedUrl;
}

export async function deleteSignedTerms(invoiceNumber: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([signedTermsPath(invoiceNumber)]);

  if (error) {
    console.error('Failed to delete signed terms:', error);
    return false;
  }

  return true;
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

/**
 * Re-encodes a picked image as a modest JPEG. Going via a canvas also applies
 * the EXIF rotation and converts formats the PDF writer cannot embed directly,
 * such as the HEIC an iPhone may hand over.
 */
async function toJpeg(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the image for conversion.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new Error('Could not convert the image.');

  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Turns the picked files into one PDF. A single PDF is passed through untouched
 * so a scan made by the phone's own document scanner keeps its quality; images
 * are laid out one per A4 page in the order they were added.
 */
export async function filesToPdf(files: File[]): Promise<Blob> {
  if (files.length === 0) throw new Error('Nothing to save.');

  if (files.length === 1 && isPdf(files[0])) {
    return files[0];
  }

  if (files.some(isPdf)) {
    throw new Error('Please attach either one PDF on its own, or photos only.');
  }

  const doc = await PDFDocument.create();
  doc.setTitle('Signed Terms of Sale');
  doc.setCreationDate(new Date());

  for (const file of files) {
    let jpeg: Uint8Array;
    try {
      jpeg = await toJpeg(file);
    } catch (error) {
      console.error('Could not read the picked image:', error);
      // Most often a HEIC taken on an iPhone being attached from a browser that
      // cannot decode it, so name the file and point at a format that works.
      throw new Error(
        `Could not read "${file.name}". Try attaching it as a JPEG or PDF instead.`,
      );
    }

    const image = await doc.embedJpg(jpeg);
    const page = doc.addPage([PAGE.width, PAGE.height]);
    const maxWidth = PAGE.width - PAGE_PADDING * 2;
    const maxHeight = PAGE.height - PAGE_PADDING * 2;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (PAGE.width - width) / 2,
      y: (PAGE.height - height) / 2,
      width,
      height,
    });
  }

  return new Blob([await doc.save() as unknown as BlobPart], { type: 'application/pdf' });
}
