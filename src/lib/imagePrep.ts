/**
 * Turning photos picked in the browser into bytes a PDF can embed.
 *
 * Everything goes through a canvas, which normalises formats the PDF writer
 * cannot take directly (the HEIC an iPhone hands over), applies the EXIF
 * rotation, and brings a 12-megapixel photo down to a sensible size.
 *
 * The capture time is read from the original file before that conversion, since
 * a canvas re-encode drops the metadata.
 */

export interface JpegOptions {
  /** Longest edge in pixels after downscaling. */
  maxEdge?: number;
  quality?: number;
}

const DEFAULTS: Required<JpegOptions> = { maxEdge: 2200, quality: 0.82 };

export async function imageToJpeg(file: Blob, options: JpegOptions = {}): Promise<Uint8Array> {
  const { maxEdge, quality } = { ...DEFAULTS, ...options };
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the image for conversion.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new Error('Could not convert the image.');

  return new Uint8Array(await blob.arrayBuffer());
}

/** Enough of the file to cover the EXIF block, which sits near the start. */
const EXIF_SCAN_BYTES = 256 * 1024;

const TAG_DATE_TIME = 0x0132;
const TAG_EXIF_IFD = 0x8769;
const TAG_DATE_TIME_ORIGINAL = 0x9003;

/**
 * When the photo was taken, from the JPEG's EXIF block, or null when the file
 * carries no capture time.
 *
 * Deliberately returns null rather than falling back to the file's modified
 * date: on a proof-of-work page an invented timestamp is worse than none.
 */
export async function readCaptureDate(file: Blob): Promise<Date | null> {
  try {
    const view = new DataView(await file.slice(0, EXIF_SCAN_BYTES).arrayBuffer());
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

    const exifStart = findExifStart(view);
    if (exifStart === null) return null;

    return readExifDate(view, exifStart);
  } catch {
    return null;
  }
}

/** Walks the JPEG segments to the start of the APP1 Exif payload's TIFF header. */
function findExifStart(view: DataView): number | null {
  let offset = 2;

  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset++; // Fill byte or desynchronised; step until a marker turns up.
      continue;
    }

    const marker = view.getUint8(offset + 1);
    // Start of scan: image data begins, so no metadata follows.
    if (marker === 0xda) return null;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }

    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && offset + 10 <= view.byteLength) {
      const isExif =
        view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0x0000;
      if (isExif) return offset + 10;
    }

    offset += 2 + length;
  }

  return null;
}

function readExifDate(view: DataView, start: number): Date | null {
  if (start + 8 > view.byteLength) return null;

  const byteOrder = view.getUint16(start);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return null;
  const little = byteOrder === 0x4949;

  const u16 = (at: number) => view.getUint16(at, little);
  const u32 = (at: number) => view.getUint32(at, little);

  const ifd0 = start + u32(start + 4);
  const fromIfd0 = findTag(view, start, ifd0, [TAG_DATE_TIME_ORIGINAL, TAG_DATE_TIME], u16, u32);
  if (typeof fromIfd0 === 'string') return parseExifDate(fromIfd0);

  // The capture time normally lives in the Exif sub-IFD rather than IFD0.
  const exifIfdPointer = findTag(view, start, ifd0, [TAG_EXIF_IFD], u16, u32, true);
  if (typeof exifIfdPointer !== 'number') return null;

  const value = findTag(
    view,
    start,
    start + exifIfdPointer,
    [TAG_DATE_TIME_ORIGINAL, TAG_DATE_TIME],
    u16,
    u32,
  );
  return typeof value === 'string' ? parseExifDate(value) : null;
}

/**
 * Scans one IFD for the first of the wanted tags. Returns the ASCII value, or
 * the numeric value when asNumber is set (used for the sub-IFD pointer).
 */
function findTag(
  view: DataView,
  tiffStart: number,
  ifdStart: number,
  wanted: number[],
  u16: (at: number) => number,
  u32: (at: number) => number,
  asNumber = false,
): string | number | null {
  if (ifdStart + 2 > view.byteLength) return null;

  const entries = u16(ifdStart);
  for (let index = 0; index < entries; index++) {
    const entry = ifdStart + 2 + index * 12;
    if (entry + 12 > view.byteLength) return null;

    const tag = u16(entry);
    if (!wanted.includes(tag)) continue;

    if (asNumber) return u32(entry + 8);

    const count = u32(entry + 4);
    const valueStart = count > 4 ? tiffStart + u32(entry + 8) : entry + 8;
    if (valueStart + count > view.byteLength) return null;

    let value = '';
    for (let position = 0; position < count; position++) {
      const code = view.getUint8(valueStart + position);
      if (code === 0) break;
      value += String.fromCharCode(code);
    }
    return value.trim();
  }

  return null;
}

/** EXIF dates look like "2026:08:28 14:32:10" and are in local time. */
function parseExifDate(value: string): Date | null {
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date;
}
