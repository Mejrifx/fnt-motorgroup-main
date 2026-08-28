import { rgb, type PDFDocument, type PDFImage } from 'pdf-lib';
import {
  COLOR,
  CONTENT_WIDTH,
  GUTTER,
  MARGIN,
  PAGE,
  TYPE,
  formatInvoiceDate,
} from './invoiceTheme';
import { FOOTER_RULE_Y, drawFooter, drawHeader } from './invoiceChrome';
import { drawText, rule, wrapText, type Ctx } from './pdfKit';

/**
 * The photographic record attached to a service invoice.
 *
 * A PDF is a document, not evidence: anyone with the right tools can produce a
 * page that looks like this one. What makes it hold up is that the same photos
 * are kept on file against the invoice, and that the page carries a reference
 * derived from those exact image bytes — so a page and the record it claims to
 * come from can be checked against each other. The wording on the page says only
 * that, and claims nothing the document cannot back up.
 */

export interface ProofPhoto {
  /** JPEG bytes, as stored, so the reference stays reproducible. */
  bytes: Uint8Array;
  caption?: string;
  /** Capture time from the photo's own metadata. Omitted when it had none. */
  takenAt?: string;
}

export interface ProofOfWorkInput {
  invoiceNumber: string;
  invoiceDate: string;
  vehicleReg?: string;
  photos: ProofPhoto[];
  /** Invoice number plus a fingerprint of the photos, from proofReference(). */
  reference: string;
}

/** Beyond this the PDF gets too heavy to email comfortably. */
export const MAX_PROOF_PHOTOS = 12;
const PHOTOS_PER_PAGE = 4;

const ROW_GAP = 20;
const CAPTION_TOP_GAP = 11;
const CAPTION_LEADING = 11.5;
const BADGE = 13;
const CAPTION_INDENT = BADGE + 7;
/** Spare height is shared out above and between the rows, up to this much each. */
const MAX_EXTRA_GAP = 44;
const FRAME_INSET = 4;
const GRID_FLOOR = FOOTER_RULE_Y + 18;

const FRAME_FILL = rgb(0.965, 0.968, 0.973);

export function proofPageCount(photoCount: number): number {
  return Math.ceil(Math.min(photoCount, MAX_PROOF_PHOTOS) / PHOTOS_PER_PAGE);
}

/**
 * A short code over the invoice details and the image bytes themselves. Two
 * documents claiming the same reference cannot both be right, and the code can be
 * recomputed from the stored photos at any point, so a swapped or edited photo
 * shows up as a mismatch.
 */
export async function proofReference(
  invoiceNumber: string,
  invoiceDate: string,
  photos: ProofPhoto[],
): Promise<string> {
  const header = new TextEncoder().encode(`${invoiceNumber}|${invoiceDate}|${photos.length}`);
  const total = photos.reduce((sum, photo) => sum + photo.bytes.length, header.length);

  const payload = new Uint8Array(total);
  payload.set(header, 0);
  let offset = header.length;
  for (const photo of photos) {
    payload.set(photo.bytes, offset);
    offset += photo.bytes.length;
  }

  return `${invoiceNumber}-${await shortDigest(payload)}`;
}

async function shortDigest(payload: Uint8Array): Promise<string> {
  // Web Crypto is only available in a secure context, so the portal served over
  // plain http on a local network falls back to a simple checksum. Weaker against
  // a determined forger, but still changes whenever a photo does, which is what
  // the reference is for.
  if (crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', payload);
    return Array.from(new Uint8Array(digest).slice(0, 4))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  let hash = 0x811c9dc5;
  for (const byte of payload) {
    hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').toUpperCase();
}

/** "14 August 2026 at 14:32", from the ISO capture time. */
function formatTakenAt(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const time = `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
  return `${formatInvoiceDate(`${date.getFullYear()}-${month}-${day}`)} at ${time}`;
}

interface Tile {
  photo: ProofPhoto;
  image: PDFImage;
  /** Position in the whole set, for the numbered badge. */
  number: number;
}

/** Caption plus capture time, wrapped to the width available beside the badge. */
function captionLines(ctx: Ctx, tile: Tile, width: number): string[] {
  const textWidth = Math.max(60, width - CAPTION_INDENT);
  const caption = (tile.photo.caption || '').trim() || `Photograph ${tile.number}`;
  const lines = wrapText(ctx.bold, caption, TYPE.value, textWidth).slice(0, 2);

  const taken = formatTakenAt(tile.photo.takenAt);
  if (taken) {
    lines.push(...wrapText(ctx.regular, `Photographed ${taken}`, TYPE.footer, textWidth).slice(0, 1));
  }

  return lines.length ? lines : [caption];
}

interface Layout {
  columns: number;
  /** Frame size, uniform across the page so the photos read as a set. */
  frameWidth: number;
  frameHeight: number;
  captionHeight: number;
  captions: string[][];
  rowGap: number;
  /** Space between the header and the first row. */
  topGap: number;
  /** Total drawn image area, used only to compare candidate layouts. */
  area: number;
}

function fittedSize(image: PDFImage, boxWidth: number, boxHeight: number): { width: number; height: number } {
  const scale = Math.min(
    (boxWidth - FRAME_INSET * 2) / image.width,
    (boxHeight - FRAME_INSET * 2) / image.height,
  );
  return { width: image.width * scale, height: image.height * scale };
}

/**
 * Works out how big the photos can be for a given number of columns.
 *
 * Frames are sized to the photos rather than to a fixed grid: the height comes
 * from the tallest photo once it is fitted to the column, and the width is then
 * pulled back in to whatever the widest photo actually needs. That keeps a page
 * of landscape shots from sitting in tall grey boxes, and a portrait shot from
 * being surrounded by empty frame.
 */
function planColumns(ctx: Ctx, tiles: Tile[], columns: number, available: number): Layout | null {
  const columnWidth = columns === 1 ? CONTENT_WIDTH : (CONTENT_WIDTH - GUTTER) / 2;
  const rows = Math.ceil(tiles.length / columns);

  let frameWidth = columnWidth;
  let captions: string[][] = [];
  let captionHeight = 0;
  let frameHeight = 0;

  // Two passes: the caption wrap depends on the frame width, which in turn
  // depends on how much height the captions leave for the photos.
  for (let pass = 0; pass < 2; pass++) {
    captions = tiles.map((tile) => captionLines(ctx, tile, frameWidth));
    captionHeight =
      CAPTION_TOP_GAP + Math.max(...captions.map((lines) => lines.length)) * CAPTION_LEADING + 2;

    const forPhotos = available - rows * captionHeight - (rows - 1) * ROW_GAP;
    if (forPhotos <= 0) return null;

    const natural = Math.max(
      ...tiles.map((tile) => (tile.image.height * (columnWidth - FRAME_INSET * 2)) / tile.image.width),
    );
    frameHeight = Math.min(natural + FRAME_INSET * 2, forPhotos / rows);
    if (frameHeight < 60) return null;

    const widest = Math.max(...tiles.map((tile) => fittedSize(tile.image, columnWidth, frameHeight).width));
    frameWidth = Math.min(columnWidth, widest + FRAME_INSET * 2);
  }

  const area = tiles.reduce((sum, tile) => {
    const { width, height } = fittedSize(tile.image, frameWidth, frameHeight);
    return sum + width * height;
  }, 0);

  const used = rows * (frameHeight + captionHeight) + (rows - 1) * ROW_GAP;
  const extra = Math.max(0, Math.min((available - used) / (rows + 1), MAX_EXTRA_GAP));

  return {
    columns,
    frameWidth,
    frameHeight,
    captionHeight,
    captions,
    rowGap: ROW_GAP + extra,
    topGap: extra,
    area,
  };
}

/**
 * Picks between one and two columns by which shows the photos larger. Four
 * landscape shots are best as a 2x2 grid; two are better stacked full width,
 * where each one can be nearly twice the size.
 */
function planPage(ctx: Ctx, tiles: Tile[], available: number): Layout {
  const candidates = [1, 2]
    .filter((columns) => columns <= tiles.length)
    .map((columns) => planColumns(ctx, tiles, columns, available))
    .filter((layout): layout is Layout => layout !== null);

  if (candidates.length === 0) {
    // Nothing fits cleanly; fall back to the tightest grid and let it be small.
    return {
      columns: 2,
      frameWidth: (CONTENT_WIDTH - GUTTER) / 2,
      frameHeight: Math.max(60, (available - 2 * 30) / 2),
      captionHeight: CAPTION_TOP_GAP + CAPTION_LEADING + 2,
      captions: tiles.map((tile) => [(tile.photo.caption || '').trim() || `Photograph ${tile.number}`]),
      rowGap: ROW_GAP,
      topGap: 0,
      area: 0,
    };
  }

  return candidates.reduce((best, layout) => (layout.area > best.area ? layout : best));
}

/** One framed photo with its numbered caption beneath. */
function drawTile(ctx: Ctx, tile: Tile, layout: Layout, x: number, top: number, captions: string[]): void {
  ctx.page.drawRectangle({
    x,
    y: top - layout.frameHeight,
    width: layout.frameWidth,
    height: layout.frameHeight,
    color: FRAME_FILL,
    borderColor: COLOR.hairline,
    borderWidth: 0.7,
  });

  const { width, height } = fittedSize(tile.image, layout.frameWidth, layout.frameHeight);
  ctx.page.drawImage(tile.image, {
    x: x + (layout.frameWidth - width) / 2,
    y: top - layout.frameHeight + (layout.frameHeight - height) / 2,
    width,
    height,
  });

  const badgeTop = top - layout.frameHeight - CAPTION_TOP_GAP;
  ctx.page.drawRectangle({
    x,
    y: badgeTop - BADGE,
    width: BADGE,
    height: BADGE,
    color: ctx.brand.accent,
  });
  drawText(ctx, `${tile.number}`.padStart(2, '0'), {
    x,
    y: badgeTop - BADGE + 3.9,
    size: 7.5,
    font: ctx.bold,
    color: rgb(1, 1, 1),
    align: 'center',
    width: BADGE,
  });

  let baseline = badgeTop - 9.5;
  captions.forEach((line, index) => {
    drawText(ctx, line, {
      x: x + CAPTION_INDENT,
      y: baseline,
      size: index === 0 ? TYPE.value : TYPE.footer,
      font: index === 0 ? ctx.bold : ctx.regular,
      color: index === 0 ? COLOR.heading : COLOR.muted,
    });
    baseline -= CAPTION_LEADING;
  });
}

/**
 * States plainly what the page is and what it is evidence of. Deliberately makes
 * no claim about the PDF being tamper-proof, only that the photographs are on
 * file and can be confirmed against the reference.
 */
function attestation(ctx: Ctx, input: ProofOfWorkInput): string[] {
  const vehicle = (input.vehicleReg || '').trim().toUpperCase();
  return [
    `The photographs below were taken by ${ctx.brand.legalName} during the work carried out on ${
      vehicle ? `registration ${vehicle}` : 'the vehicle'
    }, as itemised on page 1, and are held on file against this invoice.`,
    `Quote reference ${input.reference} to have this record confirmed by ${ctx.brand.name}.`,
  ];
}

function drawAttestation(ctx: Ctx, input: ProofOfWorkInput, top: number): number {
  let y = top;
  for (const paragraph of attestation(ctx, input)) {
    for (const line of wrapText(ctx.regular, paragraph, TYPE.body, CONTENT_WIDTH)) {
      drawText(ctx, line, { x: MARGIN.left, y: y - TYPE.body, size: TYPE.body, font: ctx.regular, color: COLOR.body });
      y -= TYPE.body + 4.2;
    }
    y -= 3;
  }

  y -= 5;
  rule(ctx, MARGIN.left, y, CONTENT_WIDTH, 0.7, COLOR.hairline);
  return y - 20;
}

/**
 * Adds the proof-of-work pages to a document that already holds page one.
 * Returns the number of pages added, which the caller counts towards its labels.
 */
export async function appendProofOfWorkPages(
  doc: PDFDocument,
  base: Ctx,
  logo: PDFImage | null,
  input: ProofOfWorkInput,
  options: { firstPageNumber: number; totalPages: number },
): Promise<number> {
  const photos = input.photos.slice(0, MAX_PROOF_PHOTOS);
  if (photos.length === 0) return 0;

  const tiles: Tile[] = [];
  for (const [index, photo] of photos.entries()) {
    tiles.push({ photo, image: await doc.embedJpg(photo.bytes), number: index + 1 });
  }

  const pages = proofPageCount(photos.length);

  for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
    const slice = tiles.slice(pageIndex * PHOTOS_PER_PAGE, (pageIndex + 1) * PHOTOS_PER_PAGE);
    const ctx: Ctx = { ...base, page: doc.addPage([PAGE.width, PAGE.height]) };

    let y = drawHeader(ctx, {
      title: pageIndex === 0 ? 'Proof of Work' : 'Proof of Work \u2014 continued',
      logo,
      meta: [
        ['Invoice No', input.invoiceNumber],
        ['Date', formatInvoiceDate(input.invoiceDate)],
        ['Registration', (input.vehicleReg || '\u2014').toUpperCase()],
        ['Reference', input.reference],
      ],
    });

    if (pageIndex === 0) y = drawAttestation(ctx, input, y);

    const layout = planPage(ctx, slice, y - GRID_FLOOR);
    const gridWidth = layout.columns * layout.frameWidth + (layout.columns - 1) * GUTTER;
    const startX = MARGIN.left + (CONTENT_WIDTH - gridWidth) / 2;
    const rowHeight = layout.frameHeight + layout.captionHeight + layout.rowGap;

    slice.forEach((tile, index) => {
      const row = Math.floor(index / layout.columns);
      const column = index % layout.columns;
      drawTile(
        ctx,
        tile,
        layout,
        startX + column * (layout.frameWidth + GUTTER),
        y - layout.topGap - row * rowHeight,
        layout.captions[index],
      );
    });

    drawFooter(ctx, {
      note: `Photographic record held on file \u00B7 Ref ${input.reference}`,
      pageLabel: `Page ${options.firstPageNumber + pageIndex} of ${options.totalPages}`,
    });
  }

  return pages;
}
