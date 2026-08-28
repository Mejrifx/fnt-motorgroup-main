import { supabase } from './supabase';
import { imageToJpeg, readCaptureDate } from './imagePrep';

/**
 * Storage for the photographs behind a TNT proof-of-work page.
 *
 * The images are kept as files rather than only being baked into the PDF, for
 * two reasons: editing an invoice rebuilds its PDF from scratch, so the photos
 * have to still be somewhere; and the proof-of-work reference printed on the
 * page is a fingerprint of these exact bytes, which is only worth anything if
 * the originals remain on file to check it against.
 *
 * They sit in the same private bucket as the invoices, under a path derived from
 * the invoice number, so no schema change is needed to find them again.
 */

const BUCKET = 'invoices';
const FOLDER = 'tnt-proof';
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Photos are shown around 240pt wide on the page, so this leaves plenty of
 * detail for someone zooming in without making the invoice too heavy to email.
 */
const JPEG_OPTIONS = { maxEdge: 1600, quality: 0.76 };

export interface StoredProofPhoto {
  path: string;
  caption: string;
  /** ISO capture time from the photo's metadata, when it carried one. */
  takenAt?: string;
}

/** A photo held in the form: bytes in hand, not necessarily uploaded yet. */
export interface PendingProofPhoto extends StoredProofPhoto {
  bytes: Uint8Array;
}

export function proofFolder(invoiceNumber: string): string {
  return `${FOLDER}/${invoiceNumber}`;
}

function photoPath(invoiceNumber: string, index: number): string {
  return `${proofFolder(invoiceNumber)}/${`${index + 1}`.padStart(2, '0')}.jpg`;
}

/**
 * Reads a picked file into the bytes that will be both embedded and stored, and
 * lifts the capture time out of the original before the re-encode drops it.
 */
export async function prepareProofPhoto(file: File): Promise<{ bytes: Uint8Array; takenAt?: string }> {
  const takenAt = await readCaptureDate(file);
  const bytes = await imageToJpeg(file, JPEG_OPTIONS);
  return { bytes, takenAt: takenAt ? takenAt.toISOString() : undefined };
}

/**
 * Writes the photos for an invoice and clears out anything left over from a
 * previous save, so the folder always matches what the current PDF shows.
 * Returns what to record in the invoice's metadata.
 */
export async function saveProofPhotos(
  invoiceNumber: string,
  photos: PendingProofPhoto[],
): Promise<StoredProofPhoto[]> {
  const saved: StoredProofPhoto[] = [];

  for (const [index, photo] of photos.entries()) {
    const path = photoPath(invoiceNumber, index);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, new Blob([photo.bytes as unknown as BlobPart], { type: 'image/jpeg' }), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Failed to upload a proof-of-work photo:', error);
      // The bucket was created accepting PDFs only; migration 018 adds JPEG.
      if (/mime/i.test(error.message)) {
        throw new Error(
          'Storage is not set up for photos yet. Run migration 018 to allow JPEG in the invoices bucket.',
        );
      }
      throw new Error('Could not save the proof-of-work photos. Please try again.');
    }

    saved.push({ path, caption: photo.caption, takenAt: photo.takenAt });
  }

  await pruneProofPhotos(invoiceNumber, saved.map((photo) => photo.path));
  return saved;
}

/** Removes stored photos that are no longer part of the invoice. */
async function pruneProofPhotos(invoiceNumber: string, keep: string[]): Promise<void> {
  const existing = await listProofPhotoPaths(invoiceNumber);
  const stale = existing.filter((path) => !keep.includes(path));
  if (stale.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(stale);
  if (error) console.error('Failed to remove replaced proof-of-work photos:', error);
}

async function listProofPhotoPaths(invoiceNumber: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(proofFolder(invoiceNumber), { limit: 100 });

  if (error) {
    console.error('Failed to list proof-of-work photos:', error);
    return [];
  }

  return (data ?? [])
    .filter((object) => /\.jpe?g$/i.test(object.name))
    .map((object) => `${proofFolder(invoiceNumber)}/${object.name}`);
}

/** Fetches the stored bytes, needed to rebuild the PDF when editing. */
export async function downloadProofPhoto(path: string): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error || !data) {
    console.error('Failed to download a proof-of-work photo:', error);
    return null;
  }

  return new Uint8Array(await data.arrayBuffer());
}

/** Short-lived link for showing a thumbnail; the bucket is private. */
export async function getProofPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('Failed to create a proof-of-work photo URL:', error);
    return null;
  }

  return data.signedUrl;
}

/** Called when an invoice is deleted, so no orphaned photos are left behind. */
export async function deleteProofPhotos(invoiceNumber: string): Promise<void> {
  const paths = await listProofPhotoPaths(invoiceNumber);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error('Failed to delete proof-of-work photos:', error);
}

/** Reads the metadata written by saveProofPhotos back into a usable list. */
export function readStoredProofPhotos(metadata: unknown): StoredProofPhoto[] {
  const proof = (metadata as { proof_of_work?: { photos?: unknown } } | null)?.proof_of_work;
  if (!proof || !Array.isArray(proof.photos)) return [];

  return proof.photos
    .filter((photo): photo is { path: string; caption?: string; taken_at?: string } =>
      Boolean(photo && typeof (photo as { path?: unknown }).path === 'string'))
    .map((photo) => ({
      path: photo.path,
      caption: photo.caption ?? '',
      takenAt: photo.taken_at,
    }));
}

/** The shape written into invoices.metadata. */
export function proofMetadata(photos: StoredProofPhoto[]): {
  photos: Array<{ path: string; caption: string; taken_at?: string }>;
} {
  return {
    photos: photos.map((photo) => ({
      path: photo.path,
      caption: photo.caption,
      taken_at: photo.takenAt,
    })),
  };
}
