import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  ImagePlus,
  Link2,
  Pin,
  Share2,
  Trash2,
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
import { compressImageFile, formatPriceLabel } from '../lib/portability';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  card: ProductCard | null;
  initialEditMode: boolean;
  groups: ProductGroup[];
  settings: AppSettings;
  onClose: () => void;
  onSave: (updated: ProductCard) => void;
  onShare: (card: ProductCard) => void;
  onArchive: (cardId: string) => void;
  onTrash: (cardId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  card,
  initialEditMode,
  groups,
  settings,
  onClose,
  onSave,
  onShare,
  onArchive,
  onTrash,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('In Stock');
  const [groupId, setGroupId] = useState<string>('');
  const [color, setColor] = useState<CardColorKey>('white');
  const [pinned, setPinned] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    if (!card) return;
    setIsEditing(initialEditMode && card.permission !== 'view');
    setActiveImgIndex(0);
    setTitle(card.title);
    setSku(card.sku);
    setPrice(card.price);
    setUnit(card.unit);
    setSpecsText(card.specs.join('\n'));
    setStockStatus(card.stockStatus);
    setGroupId(card.groupId ?? '');
    setColor(card.color);
    setPinned(card.pinned);
    setImages(card.images);
    setShowUrlInput(false);
    setUrlDraft('');
  }, [card, initialEditMode]);

  useEffect(() => {
    if (!card) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  const isViewOnly = card.permission === 'view';
  const groupName = groups.find((g) => g.id === (isEditing ? groupId : card.groupId))?.name;
  const formattedPrice = settings.showPrices
    ? formatPriceLabel(card.price, card.unit, settings.pricePrefix)
    : null;
  const currentImages = isEditing ? images : card.images;
  const safeImgIdx = Math.min(activeImgIndex, Math.max(0, currentImages.length - 1));

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const added: string[] = [];
    for (const file of files) {
      try {
        added.push(await compressImageFile(file));
      } catch {
        // skip unsupported file
      }
    }
    if (added.length > 0) {
      setImages((prev) => {
        const next = [...prev, ...added];
        setActiveImgIndex(next.length - 1);
        return next;
      });
    }
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const clean = urlDraft.trim();
    if (!clean) return;
    setImages((prev) => {
      const next = [...prev, clean];
      setActiveImgIndex(next.length - 1);
      return next;
    });
    setUrlDraft('');
    setShowUrlInput(false);
  };

  const handleSave = () => {
    const specs = specsText
      .split('\n')
      .map((s) => s.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    onSave({
      ...card,
      title: title.trim() || 'Untitled Product',
      sku: sku.trim(),
      price: price.trim(),
      unit: unit.trim(),
      specs,
      stockStatus,
      groupId: groupId || null,
      color,
      pinned,
      images,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
  };

  const handleQuickPinToggle = () => {
    const nextPinned = !pinned;
    setPinned(nextPinned);
    if (!isEditing) {
      onSave({ ...card, pinned: nextPinned, updatedAt: Date.now() });
    }
  };

  const colorStyle = CARD_COLORS[isEditing ? color : card.color] ?? CARD_COLORS.white;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col ${colorStyle.surfaceClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(isEditing ? color : card.color) !== 'white' && (
          <div className={`h-1.5 w-full shrink-0 ${colorStyle.topBarClass}`} />
        )}

        {/* Modal Top Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 bg-white/75 shrink-0">
          <div className="flex items-center gap-2 min-w-0 text-xs text-slate-500">
            <span className="font-semibold text-slate-800 truncate">
              {groupName || 'Ungrouped'}
            </span>
            {card.sku && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{card.sku}</span>
              </>
            )}
            {card.sharedBy && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#15803D] font-medium truncate">
                  Shared by {card.sharedBy}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleQuickPinToggle}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                pinned
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={pinned ? 'Unpin' : 'Pin'}
              aria-label={pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`w-4 h-4 ${pinned ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onShare(card)}
              className="h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {!isViewOnly && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold bg-[#15803D] text-white hover:bg-[#166534] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close product detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
          {/* Left: Product Image Gallery */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100">
              <ProductImage
                src={currentImages[safeImgIdx]}
                alt={title || card.title}
                className="w-full h-full"
              />

              {currentImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImgIndex((i) =>
                        i === 0 ? currentImages.length - 1 : i - 1
                      )
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center hover:bg-white cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImgIndex((i) => (i + 1) % currentImages.length)
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center hover:bg-white cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/75 text-white font-mono text-[11px] tabular-nums">
                    {safeImgIdx + 1} / {currentImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {(currentImages.length > 1 || isEditing) && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentImages.map((src, idx) => (
                  <div
                    key={`${idx}-${src.slice(0, 20)}`}
                    className={`relative w-16 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                      idx === safeImgIdx
                        ? 'border-[#15803D]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    onClick={() => setActiveImgIndex(idx)}
                  >
                    <img
                      src={src}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages((prev) => prev.filter((_, i) => i !== idx));
                          setActiveImgIndex(0);
                        }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center cursor-pointer"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadImages}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-14 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-[10px] font-medium text-slate-500 hover:border-[#15803D] hover:text-[#15803D] shrink-0 cursor-pointer"
                    >
                      <ImagePlus className="w-4 h-4 mb-0.5" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput((v) => !v)}
                      className="w-16 h-14 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-[10px] font-medium text-slate-500 hover:border-[#15803D] hover:text-[#15803D] shrink-0 cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 mb-0.5" />
                      URL
                    </button>
                  </>
                )}
              </div>
            )}

            {isEditing && showUrlInput && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://example.com/product.jpg"
                  className="flex-1 h-8 px-2 text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="h-8 px-3 rounded-lg bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Right: Specs & Editable Details */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-display text-sm font-bold text-slate-900 focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      SKU / Code
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Optional"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Availability
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#15803D]"
                    >
                      {STOCK_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Price (optional)
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Leave blank if not needed"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-mono text-xs tabular-nums text-slate-900 focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Unit (optional)
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. piece, set, kg"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Group / Collection
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="">No Group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Specifications (one line per bullet)
                  </label>
                  <textarea
                    rows={4}
                    value={specsText}
                    onChange={(e) => setSpecsText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#15803D] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Card Accent Tint
                  </label>
                  <div className="flex items-center gap-2">
                    {(Object.keys(CARD_COLORS) as CardColorKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setColor(key)}
                        title={CARD_COLORS[key].label}
                        className={`w-7 h-7 rounded-full border transition-transform cursor-pointer ${
                          CARD_COLORS[key].swatchClass
                        } ${
                          color === key
                            ? 'ring-2 ring-[#15803D] ring-offset-1 scale-110'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span
                      className={
                        card.stockStatus === 'In Stock'
                          ? 'text-[#15803D] font-semibold'
                          : card.stockStatus === 'Out of Stock'
                          ? 'text-rose-700 font-semibold'
                          : 'text-slate-700 font-semibold'
                      }
                    >
                      {card.stockStatus}
                    </span>
                    {isViewOnly && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          View only
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-slate-900 leading-tight text-balance">
                    {card.title}
                  </h2>

                  {formattedPrice && (
                    <p className="mt-2.5 font-mono text-xl font-semibold tabular-nums text-[#15803D]">
                      {formattedPrice}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">
                    Specifications &amp; Notes
                  </h3>
                  {card.specs.length > 0 ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {card.specs.map((spec, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="text-[#15803D] font-bold mt-0.5">•</span>
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No specifications added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bottom modal action bar */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-10 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-900/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="h-10 px-5 rounded-xl bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    {!isViewOnly && card.status === 'active' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onArchive(card.id);
                            onClose();
                          }}
                          className="h-10 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 cursor-pointer"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archive</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onTrash(card.id);
                            onClose();
                          }}
                          className="h-10 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Move to Trash</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onShare(card)}
                    className="h-10 px-4 rounded-xl bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share JSON / ZIP</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
