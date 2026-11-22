import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Database,
  Download,
  FileArchive,
  FileJson,
  FolderUp,
  Loader2,
  RotateCcw,
  Tag,
  X,
} from 'lucide-react';
import { AppSettings, ImportPreview, ProductCard, ProductGroup } from '../types';
import { formatBytes, parseImportFile } from '../lib/portability';

interface SettingsModalProps {
  isOpen: boolean;
  initialTab?: 'pricing' | 'import' | 'data';
  settings: AppSettings;
  cards: ProductCard[];
  groups: ProductGroup[];
  storageEngine: 'indexeddb' | 'localstorage';
  onClose: () => void;
  onUpdateSettings: (next: AppSettings) => void;
  onBulkUpdatePrice: (opts: {
    scope: 'all' | 'missing' | string;
    price: string;
    unit: string;
    clear: boolean;
  }) => void;
  onConfirmImport: (preview: ImportPreview, mode: 'merge' | 'replace') => void;
  onShareCatalog: () => void;
  onResetSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  initialTab = 'pricing',
  settings,
  cards,
  groups,
  storageEngine,
  onClose,
  onUpdateSettings,
  onBulkUpdatePrice,
  onConfirmImport,
  onShareCatalog,
  onResetSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'pricing' | 'import' | 'data'>(initialTab);
  const [bulkScope, setBulkScope] = useState<string>('all');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkUnit, setBulkUnit] = useState('');

  const [parsing, setParsing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setImportError(null);
      setImportPreview(null);
      setConfirmReset(false);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCards = cards.filter((c) => c.status === 'active');
  const pricedCount = activeCards.filter((c) => c.price.trim().length > 0).length;

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setImportError(null);
    setImportPreview(null);
    try {
      const preview = await parseImportFile(file);
      setImportPreview(preview);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Unable to read the selected file.'
      );
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelected(file);
  };

  const handleApplyBulk = () => {
    if (!bulkPrice.trim()) return;
    onBulkUpdatePrice({
      scope: bulkScope,
      price: bulkPrice.trim(),
      unit: bulkUnit.trim(),
      clear: false,
    });
    setBulkPrice('');
    setBulkUnit('');
  };

  const handleClearBulk = () => {
    onBulkUpdatePrice({
      scope: bulkScope,
      price: '',
      unit: '',
      clear: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Settings
            </h2>
            <p className="text-xs text-slate-500">
              Pricing visibility, ZIP/JSON import, and local database
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-5 pt-4 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100">
            <button
              type="button"
              onClick={() => setTab('pricing')}
              className={`h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'pricing'
                  ? 'bg-white text-[#15803D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Pricing</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('import')}
              className={`h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'import'
                  ? 'bg-white text-[#15803D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span>Import &amp; Unzip</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('data')}
              className={`h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'data'
                  ? 'bg-white text-[#15803D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Local Data</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'pricing' && (
            <>
              {/* Toggle prices globally */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Show prices on product cards
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Prices are completely optional with no forced currency symbols. Turn this off whenever you want a clean, price-free visual catalog.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showPrices}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      showPrices: !settings.showPrices,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                    settings.showPrices ? 'bg-[#15803D]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      settings.showPrices ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Optional label prefix (defaults blank — no currency) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Price Label / Prefix (none by default)
                </label>
                <input
                  type="text"
                  value={settings.pricePrefix}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      pricePrefix: e.target.value,
                    })
                  }
                  placeholder="Leave blank for plain numbers (e.g. 480 / set)"
                  className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#15803D]"
                />
              </div>

              {/* Bulk add / clear price across all cards */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Bulk Add or Clear Price on Cards
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pricedCount} of {activeCards.length} active cards currently have a price.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Apply To
                  </label>
                  <select
                    value={bulkScope}
                    onChange={(e) => setBulkScope(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#15803D]"
                  >
                    <option value="all">All editable active cards</option>
                    <option value="missing">Only cards without a price</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Group: {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Price value (e.g. 500)"
                    className="h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 font-mono text-xs tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#15803D]"
                  />
                  <input
                    type="text"
                    value={bulkUnit}
                    onChange={(e) => setBulkUnit(e.target.value)}
                    placeholder="Unit (optional, e.g. piece)"
                    className="h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#15803D]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!bulkPrice.trim()}
                    onClick={handleApplyBulk}
                    className="h-10 px-4 rounded-xl bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Apply Price to Selected
                  </button>
                  <button
                    type="button"
                    onClick={handleClearBulk}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Clear Prices on Selected
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'import' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Import JSON or Unzip Archive
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Upload a <span className="font-mono">.zip</span> keepcard archive (automatically unzips both catalog data and bundled images) or a <span className="font-mono">.json</span> file.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.json,application/zip,application/json"
                onChange={(e) => {
                  handleFileSelected(e.target.files?.[0]);
                  e.target.value = '';
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed p-7 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-[#15803D] bg-[#F0FDF4]'
                    : 'border-slate-200 hover:border-[#15803D]/60 bg-[#F8FAFC]'
                }`}
              >
                {parsing ? (
                  <div className="flex flex-col items-center gap-2 text-[#15803D]">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span className="text-sm font-semibold">
                      Unzipping and reading catalog...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#15803D] shadow-xs">
                      <FileArchive className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Drop a .zip or .json file here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports keepcard ZIP packages with images and standalone JSON files
                    </p>
                  </div>
                )}
              </div>

              {importError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importPreview && (
                <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4]/70 p-4 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#BBF7D0] flex items-center justify-center text-[#15803D] shrink-0">
                      {importPreview.sourceType === 'zip' ? (
                        <FileArchive className="w-4 h-4" />
                      ) : (
                        <FileJson className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {importPreview.fileName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {importPreview.sourceType === 'zip'
                          ? 'Unzipped archive'
                          : 'JSON file'}{' '}
                        · {formatBytes(importPreview.fileSizeBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-white rounded-xl p-2.5 border border-[#DCFCE7]">
                    <div>
                      <span className="block font-mono text-base font-bold tabular-nums text-slate-900">
                        {importPreview.cards.length}
                      </span>
                      <span className="text-[11px] text-slate-500">Cards</span>
                    </div>
                    <div>
                      <span className="block font-mono text-base font-bold tabular-nums text-slate-900">
                        {importPreview.groups.length}
                      </span>
                      <span className="text-[11px] text-slate-500">Groups</span>
                    </div>
                    <div>
                      <span className="block font-mono text-base font-bold tabular-nums text-[#15803D]">
                        {importPreview.extractedImageCount}
                      </span>
                      <span className="text-[11px] text-slate-500">Unzipped Photos</span>
                    </div>
                  </div>

                  {importPreview.sharedBy && (
                    <p className="text-xs text-[#166534]">
                      Attributed to <strong>{importPreview.sharedBy}</strong> (
                      {importPreview.permission === 'view' ? 'View Only' : 'Can Edit'}
                      ) — merged cards will also appear in <strong>Shared with Me</strong>.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmImport(importPreview, 'merge');
                        setImportPreview(null);
                      }}
                      className="flex-1 h-10 px-4 rounded-xl bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Merge into Catalog</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmImport(importPreview, 'replace');
                        setImportPreview(null);
                      }}
                      className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Replace Entire Catalog
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Sender Name / Email (for shared files)
                </label>
                <input
                  type="text"
                  value={settings.senderName}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      senderName: e.target.value,
                    })
                  }
                  placeholder="e.g. yourname@gmail.com or Studio Name"
                  className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#15803D]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Local Database</span>
                  <span className="font-mono text-[#15803D]">
                    {storageEngine === 'indexeddb' ? 'IndexedDB (Offline Ready)' : 'Local Storage'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Stored Items</span>
                  <span className="font-mono tabular-nums">
                    {cards.length} cards · {groups.length} groups
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onShareCatalog();
                  }}
                  className="h-10 px-4 rounded-xl bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export / Share Full Catalog</span>
                </button>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Sample Catalog</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetSampleData();
                        setConfirmReset(false);
                      }}
                      className="h-10 px-3.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="h-10 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
