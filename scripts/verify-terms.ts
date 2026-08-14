/**
 * Diffs the wording in TERMS_SECTIONS against the text embedded in page 2 of the
 * original "FNT Sales Invoice + Terms FINAL.pdf", so restyling the terms can
 * never silently change the contract.
 *
 * That page draws its text through a Form XObject using subset fonts with
 * Identity-H encoding, so the glyph codes are decoded via each font's ToUnicode
 * CMap rather than read directly.
 *
 * Run via scripts/preview.sh.
 */
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';
import { PDFDict, PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { INTENTIONAL_REWORDINGS, TERMS_SECTIONS } from '../src/lib/pdf/termsOfSale';

const TEMPLATE = 'public/FNT Sales Invoice + Terms FINAL.pdf';

type CodeMap = Map<number, string>;

function decodeStream(stream: PDFRawStream): string {
  const bytes = Buffer.from(stream.getContents());
  try {
    return inflateSync(bytes).toString('latin1');
  } catch {
    return bytes.toString('latin1');
  }
}

/** UTF-16BE hex (possibly several code units) to a string. */
function hexToString(hex: string): string {
  let out = '';
  for (let i = 0; i + 3 < hex.length; i += 4) {
    out += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
  }
  return out || String.fromCharCode(parseInt(hex, 16));
}

function parseToUnicode(cmap: string): CodeMap {
  const map: CodeMap = new Map();

  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const entry of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(parseInt(entry[1], 16), hexToString(entry[2]));
    }
  }

  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const entry of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const lo = parseInt(entry[1], 16);
      const hi = parseInt(entry[2], 16);
      const base = parseInt(entry[3], 16);
      for (let code = lo; code <= hi; code++) {
        map.set(code, String.fromCharCode(base + (code - lo)));
      }
    }
    for (const entry of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g)) {
      const lo = parseInt(entry[1], 16);
      const items = [...entry[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((m) => hexToString(m[1]));
      items.forEach((value, index) => map.set(lo + index, value));
    }
  }

  return map;
}

/** Turns a PDF literal string body into its raw bytes. */
function unescapeLiteral(body: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char !== '\\') {
      bytes.push(body.charCodeAt(i));
      continue;
    }
    const next = body[++i];
    const simple: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12 };
    if (next in simple) {
      bytes.push(simple[next]);
    } else if (next >= '0' && next <= '7') {
      let octal = next;
      while (octal.length < 3 && body[i + 1] >= '0' && body[i + 1] <= '7') octal += body[++i];
      bytes.push(parseInt(octal, 8));
    } else if (next !== undefined) {
      bytes.push(body.charCodeAt(i));
    }
  }
  return bytes;
}

function decodeShownString(operand: string, map: CodeMap | undefined): string {
  let bytes: number[];
  if (operand.startsWith('<')) {
    const hex = operand.slice(1, -1).replace(/\s+/g, '');
    bytes = [];
    for (let i = 0; i + 1 < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  } else {
    bytes = unescapeLiteral(operand.slice(1, -1));
  }

  if (!map || map.size === 0) {
    return bytes.map((b) => String.fromCharCode(b)).join('');
  }

  let out = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    out += map.get(code) ?? '';
  }
  return out;
}

/**
 * Walks a content stream in order, tracking the selected font.
 *
 * This template positions every glyph with its own operator, so neither shown
 * strings nor positioning operators can be treated as word boundaries. Word
 * breaks come only from the real space glyphs in the text.
 */
function extractText(content: string, fonts: Map<string, CodeMap>): string {
  const token =
    /\/([A-Za-z0-9+._-]+)\s+[-\d.]+\s+Tf|\[((?:\\.|[^\]\\])*)\]\s*TJ|(\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]*>)\s*Tj/g;
  let current: CodeMap | undefined;
  let out = '';
  let match: RegExpExecArray | null;

  while ((match = token.exec(content)) !== null) {
    if (match[1] !== undefined) {
      current = fonts.get(match[1]);
    } else if (match[2] !== undefined) {
      for (const operand of match[2].matchAll(/\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]*>/g)) {
        out += decodeShownString(operand[0], current);
      }
    } else if (match[3] !== undefined) {
      out += decodeShownString(match[3], current);
    }
  }

  return out;
}

function main() {
  const doc = PDFDocument.load(readFileSync(TEMPLATE), { updateMetadata: false });
  return doc.then((loaded) => run(loaded));
}

function fontMap(context: PDFDocument['context'], resources: PDFDict | undefined): Map<string, CodeMap> {
  const fonts = new Map<string, CodeMap>();
  const fontDict = context.lookup(resources?.get(PDFName.of('Font')));
  if (!(fontDict instanceof PDFDict)) return fonts;

  for (const [name, ref] of fontDict.entries()) {
    const font = context.lookup(ref);
    if (!(font instanceof PDFDict)) continue;
    const toUnicode = context.lookup(font.get(PDFName.of('ToUnicode')));
    if (toUnicode instanceof PDFRawStream) {
      fonts.set(name.asString().replace(/^\//, ''), parseToUnicode(decodeStream(toUnicode)));
    }
  }
  return fonts;
}

function run(doc: PDFDocument) {
  const context = doc.context;
  const page = doc.getPages()[1];
  const collected: string[] = [];

  const visit = (stream: PDFRawStream, depth: number) => {
    if (depth > 6) return;
    const resources = context.lookup(stream.dict.get(PDFName.of('Resources')));
    collected.push(extractText(decodeStream(stream), fontMap(context, resources as PDFDict)));

    const xObjects = context.lookup((resources as PDFDict)?.get(PDFName.of('XObject')));
    if (!(xObjects instanceof PDFDict)) return;
    for (const [, ref] of xObjects.entries()) {
      const child = context.lookup(ref);
      // Only Form XObjects carry text; Image streams would decode to noise.
      if (child instanceof PDFRawStream && child.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
        visit(child, depth + 1);
      }
    }
  };

  const pageContents = context.lookup(page.node.get(PDFName.of('Contents')));
  if (pageContents instanceof PDFRawStream) {
    const pageFonts = fontMap(context, context.lookup(page.node.get(PDFName.of('Resources'))) as PDFDict);
    collected.push(extractText(decodeStream(pageContents), pageFonts));

    const resources = context.lookup(page.node.get(PDFName.of('Resources')));
    const xObjects = context.lookup((resources as PDFDict)?.get(PDFName.of('XObject')));
    if (xObjects instanceof PDFDict) {
      for (const [, ref] of xObjects.entries()) {
        const child = context.lookup(ref);
        if (child instanceof PDFRawStream && child.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
          visit(child, 1);
        }
      }
    }
  }

  const words = (value: string) =>
    value
      .replace(/\u00A3/g, ' pound ')
      .replace(/&/g, ' and ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  /**
   * Whitespace is dropped entirely for the comparison: the original wraps some
   * clauses across lines without a space glyph, which would otherwise look like
   * a wording change.
   */
  const compact = (value: string) => words(value).replace(/ /g, '');

  const original = words(collected.join(' '));
  const haystack = compact(collected.join(' '));

  const reworded = new Set(INTENTIONAL_REWORDINGS.map((entry) => compact(entry.now)));

  const missing: string[] = [];
  for (const section of TERMS_SECTIONS) {
    for (const clause of [section.title, ...section.clauses]) {
      const needle = compact(clause);
      if (reworded.has(needle) || haystack.includes(needle)) continue;
      missing.push(clause);
    }
  }

  const clauseCount = TERMS_SECTIONS.reduce((sum, s) => sum + s.clauses.length, 0);
  console.log(`words recovered from original page 2: ${original.split(' ').filter(Boolean).length}`);
  console.log(`restyled: ${TERMS_SECTIONS.length} sections, ${clauseCount} clauses`);

  if (original.length < 200) {
    console.log('\nFAIL - could not recover enough text from the original to compare against.');
    process.exit(1);
  }

  // A rewording that no longer replaces anything means the original changed
  // underneath us, so the exemption should not silently keep passing.
  const staleExemptions = INTENTIONAL_REWORDINGS.filter((entry) => !haystack.includes(compact(entry.was)));

  if (missing.length === 0 && staleExemptions.length === 0) {
    console.log(
      `\nPASS - every heading and clause matches the original template, except ${INTENTIONAL_REWORDINGS.length} deliberate rewording(s):`,
    );
    for (const entry of INTENTIONAL_REWORDINGS) {
      console.log(`  was: ${entry.was}`);
      console.log(`  now: ${entry.now}`);
    }
    return;
  }

  if (missing.length > 0) {
    console.log(`\nFAIL - ${missing.length} item(s) differ from the original without being declared:`);
    for (const item of missing) console.log(`  - ${item}`);
  }
  for (const entry of staleExemptions) {
    console.log(`\nFAIL - declared rewording no longer matches anything in the original: "${entry.was}"`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
