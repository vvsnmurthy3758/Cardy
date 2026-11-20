import React, { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Edit3,
  Eye,
  Palette,
  Pin,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  CARD_COLORS,
  CardColorKey,
  LayoutMode,
  ProductCard,
  StockStatus,
} from '../types';
import { formatPriceLabel } from '../lib/portability';
import { ProductImage } from './ProductImage';

interface ProductCardTileProps {
  card: ProductCard;
  groupName?: string;
  settings: AppSettings;
  layoutMode: LayoutMode;
  onOpen: (card: ProductCard, startInEdit?: boolean) => void;
  onTogglePin: (cardId: string) => void;
  onChangeColor: (cardId: string, color: CardColorKey) => void;
  onShare: (card: ProductCard) => void;
  onArchive: (cardId: string) => void;
  onTrash: (cardId: string) => void;
  onRestore: (cardId: string) => void;
  onDeleteForever: (cardId: string) => void;
}

function stockBadgeStyle(status: StockStatus): string {
  switch (status) {
    case 'In Stock':
      return 'bg-[#15803D]/90 text-white';
    case 'Made to Order':
      return 'bg-slate-900/80 text-white';
    case 'Out of Stock':
      return 'bg-rose-700/90 text-white';
  }
}

export const ProductCardTile: React.FC<ProductCardTileProps> = ({
  card,
  groupName,
  settings,
  layoutMode,
  onOpen,
  onTogglePin,
  onChangeColor,
  onShare,
  onArchive,
  onTrash,
  onRestore,
  onDeleteForever,
}) => {
  const [showColors, setShowColors] = useState(false);

  const isViewOnly = card.permission === 'view';
  const isArchivedOrTrashed = card.status !== 'active';
  const colorStyle = CARD_COLORS[card.color] ?? CARD_COLORS.white;
  const formattedPrice = settings.showPrices
    ? formatPriceLabel(card.price, card.unit, settings.pricePrefix)
    : null;

  const stopAnd = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  if (layoutMode === 'list') {
    return (
      <article
        onClick={() => onOpen(card, false)}
        className={`group relative rounded-2xl border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer overflow-visible ${colorStyle.surfaceClass}`}
      >
        {card.color !== 'white' && (
          <div className={`h-1 w-full rounded-t-2xl ${colorStyle.topBarClass}`} />
        )}

        <div className="flex flex-col sm:flex-row items-stretch gap-4 p-3.5 sm:p-4">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden shrink-0">
            <ProductImage
              src={card.images[0]}
              alt={card.title}
              className="w-full h-full"
              imgClassName="transition-transform duration-300 group-hover:scale-105"
            />
            <span
              className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-medium backdrop-blur-xs shadow-xs ${stockBadgeStyle(
                card.stockStatus
              )}`}
            >
              {card.stockStatus}
            </span>
            {!isArchivedOrTrashed && (
              <button
                type="button"
                onClick={stopAnd(() => onTogglePin(card.id))}
                className={`absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer ${
                  card.pinned
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : 'bg-white/85 text-slate-600 hover:bg-white hover:text-[#15803D]'
                }`}
                title={card.pinned ? 'Unpin' : 'Pin'}
                aria-label={card.pinned ? 'Unpin product' : 'Pin product'}
              >
                <Pin className={`w-3.5 h-3.5 ${card.pinned ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                {groupName && <span className="font-medium text-slate-600">{groupName}</span>}
                {groupName && card.sku && <span aria-hidden="true">·</span>}
                {card.sku && <span className="font-mono">{card.sku}</span>}
                {card.sharedBy && (
                  <>
                    {(groupName || card.sku) && <span aria-hidden="true">·</span>}
                    <span className="text-[#15803D] font-medium">
                      Shared by {card.sharedBy}
                    </span>
                  </>
                )}
                {isViewOnly && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Eye className="w-3 h-3" />
                      View only
                    </span>
                  </>
                )}
              </div>

              <h3 className="mt-1 font-display text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                {card.title}
              </h3>

              {card.specs.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {card.specs.slice(0, 3).map((spec, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span className="line-clamp-1">{spec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/70">
              <div className="min-w-0">
                {formattedPrice ? (
                  <span className="font-mono text-sm font-semibold tabular-nums text-[#15803D]">
                    {formattedPrice}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    {card.images.length > 1
                      ? `${card.images.length} photos`
                      : 'Details'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0 relative">
                {isArchivedOrTrashed ? (
                  <>
                    <button
                      type="button"
                      onClick={stopAnd(() => onRestore(card.id))}
                      className="h-9 px-2.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] hover:bg-[#DCFCE7] cursor-pointer"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopAnd(() => onDeleteForever(card.id))}
                      className="h-9 px-2.5 rounded-lg inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={stopAnd(() => onShare(card))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                      title="Share as JSON or ZIP"
                      aria-label="Share product"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {!isViewOnly && (
                      <>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={stopAnd(() => setShowColors((v) => !v))}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                            title="Change card tint"
                            aria-label="Change card tint"
                          >
                            <Palette className="w-4 h-4" />
                          </button>
                          {showColors && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-10 z-20 flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 shadow-lg"
                            >
                              {(Object.keys(CARD_COLORS) as CardColorKey[]).map(
                                (key) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      onChangeColor(card.id, key);
                                      setShowColors(false);
                                    }}
                                    title={CARD_COLORS[key].label}
                                    className={`w-6 h-6 rounded-full border cursor-pointer ${
                                      CARD_COLORS[key].swatchClass
                                    } ${
                                      card.color === key
                                        ? 'ring-2 ring-[#15803D] ring-offset-1'
                                        : ''
                                    }`}
                                  />
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={stopAnd(() => onOpen(card, true))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                          title="Edit product"
                          aria-label="Edit product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={stopAnd(() => onArchive(card.id))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 transition-colors cursor-pointer"
                          title="Archive"
                          aria-label="Archive product"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={stopAnd(() => onTrash(card.id))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Move to trash"
                          aria-label="Move to trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Tile View
  return (
    <article
      onClick={() => onOpen(card, false)}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${colorStyle.surfaceClass}`}
    >
      {card.color !== 'white' && (
        <div className={`h-1 w-full rounded-t-2xl ${colorStyle.topBarClass}`} />
      )}

      {/* Top: 4:3 product image */}
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden ${
          card.color === 'white' ? 'rounded-t-2xl' : ''
        }`}
      >
        <ProductImage
          src={card.images[0]}
          alt={card.title}
          className="w-full h-full"
          imgClassName="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Subtle bottom contrast gradient for photo count if multiple */}
        {card.images.length > 1 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/70 text-[10px] font-mono font-medium text-white backdrop-blur-xs">
            +{card.images.length - 1}
          </span>
        )}

        {/* Top-left Stock status */}
        <span
          className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-medium backdrop-blur-xs shadow-xs ${stockBadgeStyle(
            card.stockStatus
          )}`}
        >
          {card.stockStatus}
        </span>

        {/* Top-right Pin toggle */}
        {!isArchivedOrTrashed && (
          <button
            type="button"
            onClick={stopAnd(() => onTogglePin(card.id))}
            className={`absolute top-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer ${
              card.pinned
                ? 'bg-[#15803D] text-white shadow-sm'
                : 'bg-white/85 text-slate-600 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:bg-white hover:text-[#15803D]'
            }`}
            title={card.pinned ? 'Unpin card' : 'Pin card'}
            aria-label={card.pinned ? 'Unpin card' : 'Pin card'}
          >
            <Pin className={`w-4 h-4 ${card.pinned ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Middle: Title, quiet metadata, concise spec bullets */}
      <div className="flex-1 flex flex-col p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-slate-500">
          {groupName && (
            <span className="font-medium text-slate-600 truncate max-w-[140px]">
              {groupName}
            </span>
          )}
          {groupName && card.sku && <span aria-hidden="true">·</span>}
          {card.sku && <span className="font-mono">{card.sku}</span>}
        </div>

        <h3 className="mt-1 font-display text-sm sm:text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug">
          {card.title}
        </h3>

        {card.sharedBy && (
          <p className="mt-1 text-[11px] font-medium text-[#15803D] truncate">
            Shared by {card.sharedBy}
            {isViewOnly ? ' · View only' : ''}
          </p>
        )}

        {card.specs.length > 0 && (
          <ul className="mt-2.5 space-y-1 text-xs text-slate-600 flex-1">
            {card.specs.slice(0, 2).map((spec, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-slate-400 shrink-0">•</span>
                <span className="line-clamp-1">{spec}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Bottom: Optional Price + Unit on left, Quick Actions on right */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {formattedPrice ? (
              <span className="font-mono text-sm font-semibold tabular-nums text-[#15803D] truncate block">
                {formattedPrice}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                {isViewOnly ? 'View only' : 'Open card'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0 relative">
            {isArchivedOrTrashed ? (
              <>
                <button
                  type="button"
                  onClick={stopAnd(() => onRestore(card.id))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#15803D] hover:bg-[#DCFCE7] cursor-pointer"
                  title="Restore card"
                  aria-label="Restore card"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopAnd(() => onDeleteForever(card.id))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete permanently"
                  aria-label="Delete permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={stopAnd(() => onShare(card))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                  title="Share via JSON or ZIP"
                  aria-label="Share product"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {!isViewOnly && (
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={stopAnd(() => setShowColors((v) => !v))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                        title="Card accent color"
                        aria-label="Change card color"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>

                      {showColors && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-10 z-20 flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 shadow-lg"
                        >
                          {(Object.keys(CARD_COLORS) as CardColorKey[]).map(
                            (key) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  onChangeColor(card.id, key);
                                  setShowColors(false);
                                }}
                                title={CARD_COLORS[key].label}
                                aria-label={CARD_COLORS[key].label}
                                className={`w-6 h-6 rounded-full border cursor-pointer ${
                                  CARD_COLORS[key].swatchClass
                                } ${
                                  card.color === key
                                    ? 'ring-2 ring-[#15803D] ring-offset-1'
                                    : ''
                                }`}
                              />
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={stopAnd(() => onOpen(card, true))}
                      className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-500 hover:text-[#15803D] hover:bg-slate-900/5 transition-colors cursor-pointer"
                      title="Edit product"
                      aria-label="Edit product"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={stopAnd(() => onTrash(card.id))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Move to trash"
                      aria-label="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
