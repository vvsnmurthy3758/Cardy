import React, { useEffect, useRef, useState } from 'react';
import {
  FolderPlus,
  ImagePlus,
  Link2,
  Palette,
  Pin,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import {
  AppSettings,
  CARD_COLORS,
  CardColorKey,
  ProductCard,
  ProductGroup,
  STOCK_STATUS_OPTIONS,
  StockStatus,
} from '../types';
import { compressImageFile, generateId } from '../lib/portability';

interface QuickCreateBarProps {
  groups: ProductGroup[];
  defaultGroupId: string | null;
  settings: AppSettings;
  onCreateCard: (card: ProductCard) => void;
  onCreateGroup: (name: string) => ProductGroup;
  onNotify: (msg: string) => void;
}

export const QuickCreateBar: React.FC<QuickCreateBarProps> = ({
  groups,
  defaultGroupId,
  settings,
  onCreateCard,
  onCreateGroup,
  onNotify,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [showOptionalPrice, setShowOptionalPrice] = useState(settings.showPrices);
  const [specsText, setSpecsText] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('In Stock');
  const [groupId, setGroupId] = useState<string>(defaultGroupId ?? '');
  const [color, setColor] = useState<CardColorKey>('white');
  const [pinned, setPinned] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showNewGroupInline, setShowNewGroupInline] = useState(false);
  const [newGroupDraft, setNewGroupDraft] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setGroupId(defaultGroupId ?? '');
  }, [defaultGroupId]);

  useEffect(() => {
    setShowOptionalPrice(settings.showPrices);
  }, [settings.showPrices]);

  const hasContent =
    title.trim().length > 0 ||
    specsText.trim().length > 0 ||
    images.length > 0 ||
    price.trim().length > 0;

  const resetForm = () => {
    setTitle('');
    setSku('');
    setPrice('');
    setUnit('');
    setSpecsText('');
    setStockStatus('In Stock');
    setGroupId(defaultGroupId ?? '');
    setColor('white');
    setPinned(false);
    setImages([]);
    setShowUrlInput(false);
    setUrlDraft('');
    setShowColorMenu(false);
    setShowNewGroupInline(false);
    setNewGroupDraft('');
    setExpanded(false);
  };

  const commitCard = () => {
    if (!hasContent) {
      setExpanded(false);
      return;
    }

    const specs = specsText
      .split('\n')
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    const now = Date.now();
    const newCard: ProductCard = {
      id: generateId('card'),
      title: title.trim() || 'Untitled Product',
      sku: sku.trim(),
      price: price.trim(),
      unit: unit.trim(),
      specs,
      stockStatus,
      images,
      groupId: groupId || null,
      color,
      pinned,
      status: 'active',
      permission: 'edit',
      createdAt: now,
      updatedAt: now,
    };

    onCreateCard(newCard);
    resetForm();
  };

  // Auto-save on click outside, just like Google Keep
  useEffect(() => {
    if (!expanded) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        commitCard();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setExpanded(true);
    try {
      const processed: string[] = [];
      for (const file of files) {
        const compressed = await compressImageFile(file);
        processed.push(compressed);
      }
      setImages((prev) => [...prev, ...processed]);
    } catch {
      onNotify('Some images could not be read. Please try JPG, PNG, or WebP.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const cleaned = urlDraft.trim();
    if (!cleaned) return;
    setImages((prev) => [...prev, cleaned]);
    setUrlDraft('');
    setShowUrlInput(false);
  };

  const handleCreateInlineGroup = () => {
    const trimmed = newGroupDraft.trim();
    if (!trimmed) return;
    const created = onCreateGroup(trimmed);
    setGroupId(created.id);
    setNewGroupDraft('');
    setShowNewGroupInline(false);
  };

  const colorStyle = CARD_COLORS[color];

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto mb-7">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {!expanded ? (
        <div
          onClick={() => setExpanded(true)}
          className="flex items-center justify-between gap-2 bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl px-4 py-2.5 shadow-sm transition-all cursor-text"
        >
          <span className="text-sm font-medium text-slate-500 select-none pl-1">
            Add a product card...
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
                fileInputRef.current?.click();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors cursor-pointer"
              title="Add product images"
              aria-label="Add product images"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
                setShowNewGroupInline(true);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors cursor-pointer"
              title="Create new group"
              aria-label="Create new group"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl border shadow-md overflow-hidden transition-colors ${colorStyle.surfaceClass}`}
        >
          {color !== 'white' && <div className={`h-1 w-full ${colorStyle.topBarClass}`} />}

          <div className="p-4 sm:p-5 space-y-3.5">
            {/* Image preview strip */}
            {images.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((src, idx) => (
                  <div
                    key={`${idx}-${src.slice(0, 24)}`}
                    className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group"
                  >
                    <img
                      src={src}
                      alt={`Upload preview ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-xs text-slate-500 hover:border-[#15803D] hover:text-[#15803D] transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Photo</span>
                </button>
              </div>
            )}

            {/* Title + Pin row */}
            <div className="flex items-start gap-2">
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product title"
                className="flex-1 bg-transparent font-display text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPinned((p) => !p)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                  pinned
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-900/5'
                }`}
                title={pinned ? 'Unpin card' : 'Pin card'}
                aria-label={pinned ? 'Unpin card' : 'Pin card'}
              >
                <Pin className={`w-4 h-4 ${pinned ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Metadata Row: SKU, Group, Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU / Code (optional)"
                className="h-9 px-3 rounded-lg bg-white/80 border border-slate-200 text-xs font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#15803D]"
              />

              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                aria-label="Select group"
                className="h-9 px-2.5 rounded-lg bg-white/80 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#15803D]"
              >
                <option value="">No Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                aria-label="Stock availability"
                className="h-9 px-2.5 rounded-lg bg-white/80 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#15803D]"
              >
                {STOCK_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Price & Unit (no forced currency) */}
            {showOptionalPrice ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative flex items-center">
                  {settings.pricePrefix.trim() && (
                    <span className="absolute left-3 text-xs font-mono text-slate-500 pointer-events-none">
                      {settings.pricePrefix.trim()}
                    </span>
                  )}
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price (optional, e.g. 450)"
                    className={`w-full h-9 pr-3 rounded-lg bg-white/80 border border-slate-200 text-xs font-mono tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#15803D] ${
                      settings.pricePrefix.trim() ? 'pl-10' : 'pl-3'
                    }`}
                  />
                </div>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Unit (optional, e.g. piece, box)"
                  className="h-9 px-3 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#15803D]"
                />
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptionalPrice(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#15803D] cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Add optional price &amp; unit</span>
                </button>
              </div>
            )}

            {/* Inline new group creator */}
            {showNewGroupInline && (
              <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-xl p-2">
                <input
                  type="text"
                  value={newGroupDraft}
                  onChange={(e) => setNewGroupDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateInlineGroup();
                    }
                  }}
                  placeholder="New group name..."
                  className="flex-1 h-8 px-2 text-xs bg-transparent text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateInlineGroup}
                  className="h-8 px-3 rounded-lg bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] cursor-pointer"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGroupInline(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Cancel new group"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Inline image URL input */}
            {showUrlInput && (
              <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-xl p-2">
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Paste image URL (https://...)"
                  className="flex-1 h-8 px-2 text-xs bg-transparent text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Close image URL input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Specs / Description */}
            <textarea
              rows={3}
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              placeholder="Key specifications (one bullet per line)..."
              className="w-full rounded-xl bg-white/75 border border-slate-200/80 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#15803D] resize-none"
            />

            {/* Bottom action toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                  title="Upload images"
                  aria-label="Upload images"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput((v) => !v)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                  title="Add image from URL"
                  aria-label="Add image from URL"
                >
                  <Link2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewGroupInline((v) => !v)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                  title="New group"
                  aria-label="New group"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorMenu((v) => !v)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                    title="Card accent color"
                    aria-label="Card accent color"
                  >
                    <Palette className="w-4 h-4" />
                  </button>

                  {showColorMenu && (
                    <div className="absolute left-0 bottom-11 z-20 flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 shadow-lg">
                      {(Object.keys(CARD_COLORS) as CardColorKey[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setColor(key);
                            setShowColorMenu(false);
                          }}
                          title={CARD_COLORS[key].label}
                          aria-label={CARD_COLORS[key].label}
                          className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                            CARD_COLORS[key].swatchClass
                          } ${
                            color === key
                              ? 'ring-2 ring-[#15803D] ring-offset-1 scale-110'
                              : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {uploading && (
                  <span className="text-xs text-slate-500 ml-1">
                    Processing images...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitCard}
                  className="h-9 px-4 rounded-lg bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] transition-colors shadow-xs cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
