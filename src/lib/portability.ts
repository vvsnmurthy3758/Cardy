import JSZip from 'jszip';
import {
  CardColorKey,
  ImportPreview,
  KeepCardPackage,
  ProductCard,
  ProductGroup,
  SharePermission,
  StockStatus,
} from '../types';

const VALID_COLORS = new Set<CardColorKey>([
  'white',
  'mint',
  'sand',
  'sky',
  'rose',
  'lavender',
]);

const VALID_STOCK = new Set<StockStatus>([
  'In Stock',
  'Made to Order',
  'Out of Stock',
]);

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Formats an optional price and unit with zero hardcoded currencies.
 * Only prepends a prefix if the user explicitly configured one in Settings.
 */
export function formatPriceLabel(
  price: string,
  unit: string,
  prefix: string
): string | null {
  const cleanPrice = (price ?? '').trim();
  if (!cleanPrice) return null;
  const cleanPrefix = (prefix ?? '').trim();
  const cleanUnit = (unit ?? '').trim();
  const head = cleanPrefix ? `${cleanPrefix} ${cleanPrice}` : cleanPrice;
  return cleanUnit ? `${head} / ${cleanUnit}` : head;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function sanitizeSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'catalog'
  );
}

/**
 * Compresses an uploaded image file to a clean JPEG/WebP data URL for fast local storage.
 */
export function compressImageFile(file: File, maxDimension = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function dataUrlToUint8Array(dataUrl: string): {
  bytes: Uint8Array;
  ext: string;
} | null {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const rawSubtype = match[1].toLowerCase();
  const ext =
    rawSubtype === 'jpeg'
      ? 'jpg'
      : rawSubtype === 'svg+xml'
      ? 'svg'
      : rawSubtype;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, ext };
}

function guessMimeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg';
  }
}

async function resolveImageToBytes(
  src: string
): Promise<{ bytes: Uint8Array; ext: string } | null> {
  if (src.startsWith('data:image/')) {
    return dataUrlToUint8Array(src);
  }
  // Fetch local bundled or same-origin / CORS-enabled image
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    const buffer = await res.arrayBuffer();
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';
    else if (contentType.includes('svg')) ext = 'svg';
    else {
      const urlExt = src.split('?')[0].split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(urlExt)) {
        ext = urlExt === 'jpeg' ? 'jpg' : urlExt;
      }
    }
    return { bytes: new Uint8Array(buffer), ext };
  } catch {
    return null;
  }
}

export interface ExportOptions {
  scope: 'card' | 'group' | 'catalog';
  label: string;
  cards: ProductCard[];
  groups: ProductGroup[];
  sharedBy?: string;
  permission: SharePermission;
}

export interface BuiltExport {
  blob: Blob;
  filename: string;
  bundledImages: number;
}

export function buildJsonPackage(options: ExportOptions): BuiltExport {
  const pkg: KeepCardPackage = {
    format: 'keepcard-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    scope: options.scope,
    sharedBy: options.sharedBy?.trim() || undefined,
    permission: options.permission,
    groups: options.groups,
    cards: options.cards.map((card) => ({
      ...card,
      sharedBy: options.sharedBy?.trim() || card.sharedBy,
      permission: options.permission,
    })),
  };

  const jsonString = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `keepcard-${sanitizeSlug(options.label)}-${dateStamp}.json`;

  return { blob, filename, bundledImages: 0 };
}

export async function buildZipPackage(options: ExportOptions): Promise<BuiltExport> {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  let bundledImages = 0;

  const exportedCards: ProductCard[] = [];

  for (const card of options.cards) {
    const rewrittenImages: string[] = [];
    for (let idx = 0; idx < card.images.length; idx++) {
      const src = card.images[idx];
      const binary = await resolveImageToBytes(src);
      if (binary && imagesFolder) {
        const assetName = `${sanitizeSlug(card.id)}_${idx + 1}.${binary.ext}`;
        imagesFolder.file(assetName, binary.bytes);
        rewrittenImages.push(`images/${assetName}`);
        bundledImages++;
      } else {
        rewrittenImages.push(src);
      }
    }

    exportedCards.push({
      ...card,
      images: rewrittenImages,
      sharedBy: options.sharedBy?.trim() || card.sharedBy,
      permission: options.permission,
    });
  }

  const pkg: KeepCardPackage = {
    format: 'keepcard-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    scope: options.scope,
    sharedBy: options.sharedBy?.trim() || undefined,
    permission: options.permission,
    groups: options.groups,
    cards: exportedCards,
  };

  zip.file('data.json', JSON.stringify(pkg, null, 2));

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `keepcard-${sanitizeSlug(options.label)}-${dateStamp}.zip`;

  return { blob, filename, bundledImages };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function canUseNativeFileShare(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  );
}

export async function shareFileNative(
  blob: Blob,
  filename: string,
  title: string,
  text: string
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const mime = filename.endsWith('.zip') ? 'application/zip' : 'application/json';
  const file = new File([blob], filename, { type: mime });

  if (canUseNativeFileShare() && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall back cleanly to direct download
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

function normalizeCard(
  raw: Record<string, unknown>,
  fallbackSharedBy?: string,
  fallbackPermission: SharePermission = 'edit'
): ProductCard {
  const now = Date.now();
  const rawColor = String(raw.color ?? 'white') as CardColorKey;
  const rawStock = String(raw.stockStatus ?? 'In Stock') as StockStatus;
  const rawSpecs = Array.isArray(raw.specs)
    ? raw.specs.map((s) => String(s).trim()).filter(Boolean)
    : typeof raw.specs === 'string'
    ? raw.specs
        .split('\n')
        .map((s) => s.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean)
    : [];
  const rawImages = Array.isArray(raw.images)
    ? raw.images.map((i) => String(i).trim()).filter(Boolean)
    : Array.isArray(raw.imageUrls)
    ? raw.imageUrls.map((i) => String(i).trim()).filter(Boolean)
    : [];

  const permission: SharePermission =
    raw.permission === 'view' || raw.permission === 'edit'
      ? raw.permission
      : fallbackPermission;

  const sharedByStr =
    typeof raw.sharedBy === 'string' && raw.sharedBy.trim()
      ? raw.sharedBy.trim()
      : fallbackSharedBy;

  const status =
    raw.status === 'archived' || raw.status === 'trashed' || raw.status === 'active'
      ? raw.status
      : 'active';

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : generateId('card'),
    title: String(raw.title ?? 'Untitled Product').trim() || 'Untitled Product',
    sku: String(raw.sku ?? '').trim(),
    price: raw.price !== undefined && raw.price !== null ? String(raw.price).trim() : '',
    unit: String(raw.unit ?? '').trim(),
    specs: rawSpecs,
    stockStatus: VALID_STOCK.has(rawStock) ? rawStock : 'In Stock',
    images: rawImages,
    groupId:
      typeof raw.groupId === 'string' && raw.groupId.trim()
        ? raw.groupId.trim()
        : null,
    color: VALID_COLORS.has(rawColor) ? rawColor : 'white',
    pinned: Boolean(raw.pinned),
    status,
    sharedBy: sharedByStr,
    permission,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
  };
}

function normalizeGroup(
  raw: Record<string, unknown>,
  fallbackSharedBy?: string
): ProductGroup {
  return {
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : generateId('grp'),
    name: String(raw.name ?? 'Imported Group').trim() || 'Imported Group',
    sharedBy:
      typeof raw.sharedBy === 'string' && raw.sharedBy.trim()
        ? raw.sharedBy.trim()
        : fallbackSharedBy,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

function parseJsonPayload(
  parsed: unknown
): {
  cards: ProductCard[];
  groups: ProductGroup[];
  sharedBy?: string;
  permission: SharePermission;
  exportedAt?: string;
} {
  if (Array.isArray(parsed)) {
    const cards = parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => normalizeCard(item));
    return { cards, groups: [], permission: 'edit' };
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('The file does not contain a valid keepcard JSON structure.');
  }

  const obj = parsed as Record<string, unknown>;
  const sharedBy =
    typeof obj.sharedBy === 'string' && obj.sharedBy.trim()
      ? obj.sharedBy.trim()
      : undefined;
  const permission: SharePermission =
    obj.permission === 'view' ? 'view' : 'edit';
  const exportedAt =
    typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined;

  const rawGroups = Array.isArray(obj.groups) ? obj.groups : [];
  const groups = rawGroups
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => normalizeGroup(item, sharedBy));

  let rawCards: unknown[] = [];
  if (Array.isArray(obj.cards)) {
    rawCards = obj.cards;
  } else if (typeof obj.title === 'string') {
    // Single card JSON object
    rawCards = [obj];
  }

  const cards = rawCards
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => normalizeCard(item, sharedBy, permission));

  if (cards.length === 0 && groups.length === 0) {
    throw new Error('No product cards or groups were found in this file.');
  }

  return { cards, groups, sharedBy, permission, exportedAt };
}

/**
 * Parses either a .json file or unzips a .zip archive (extracting data.json + bundled images).
 */
export async function parseImportFile(file: File): Promise<ImportPreview> {
  const lowerName = file.name.toLowerCase();
  const isZip =
    lowerName.endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed';

  if (!isZip) {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON syntax. Please choose a valid .json or .zip keepcard file.');
    }
    const result = parseJsonPayload(parsed);
    return {
      sourceType: 'json',
      fileName: file.name,
      fileSizeBytes: file.size,
      cards: result.cards,
      groups: result.groups,
      extractedImageCount: 0,
      sharedBy: result.sharedBy,
      permission: result.permission,
      exportedAt: result.exportedAt,
    };
  }

  // Unzip archive in browser via JSZip
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('Could not unzip this archive. Make sure it is a valid .zip file.');
  }

  // Locate data.json (either at root or nested inside a top-level folder)
  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  const jsonEntry =
    fileEntries.find((entry) => /(^|\/)data\.json$/i.test(entry.name)) ??
    fileEntries.find((entry) => entry.name.toLowerCase().endsWith('.json'));

  if (!jsonEntry) {
    throw new Error('No data.json catalog file was found inside the ZIP archive.');
  }

  const jsonText = await jsonEntry.async('string');
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('The JSON file inside this ZIP archive is malformed.');
  }

  const result = parseJsonPayload(parsed);

  // Build lookup of unzipped image entries by normalized relative path and basename
  const imageDataMap = new Map<string, string>();
  const basePrefix = jsonEntry.name.includes('/')
    ? jsonEntry.name.slice(0, jsonEntry.name.lastIndexOf('/') + 1)
    : '';

  let extractedImageCount = 0;

  for (const entry of fileEntries) {
    if (entry === jsonEntry) continue;
    if (entry.name.startsWith('__MACOSX/')) continue;
    if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) continue;

    const base64 = await entry.async('base64');
    const mime = guessMimeFromExt(entry.name);
    const dataUrl = `data:${mime};base64,${base64}`;

    const relPath =
      basePrefix && entry.name.startsWith(basePrefix)
        ? entry.name.slice(basePrefix.length)
        : entry.name;

    imageDataMap.set(entry.name, dataUrl);
    imageDataMap.set(relPath, dataUrl);
    const basename = entry.name.split('/').pop();
    if (basename) imageDataMap.set(basename, dataUrl);
  }

  const hydratedCards = result.cards.map((card) => ({
    ...card,
    images: card.images.map((ref) => {
      const cleaned = ref.replace(/^\.\//, '');
      const matched =
        imageDataMap.get(cleaned) ??
        imageDataMap.get(ref) ??
        imageDataMap.get(cleaned.split('/').pop() ?? '');
      if (matched) {
        extractedImageCount++;
        return matched;
      }
      return ref;
    }),
  }));

  return {
    sourceType: 'zip',
    fileName: file.name,
    fileSizeBytes: file.size,
    cards: hydratedCards,
    groups: result.groups,
    extractedImageCount,
    sharedBy: result.sharedBy,
    permission: result.permission,
    exportedAt: result.exportedAt,
  };
}
