import React, { useEffect, useState } from 'react';
import {
  Check,
  Download,
  FileArchive,
  FileJson,
  Loader2,
  Share2,
  X,
} from 'lucide-react';
import { ProductCard, ProductGroup, SharePermission } from '../types';
import {
  buildJsonPackage,
  buildZipPackage,
  canUseNativeFileShare,
  downloadBlob,
  formatBytes,
  shareFileNative,
} from '../lib/portability';

export interface ShareTarget {
  scope: 'card' | 'group' | 'catalog';
  label: string;
  cards: ProductCard[];
  groups: ProductGroup[];
}

interface ShareModalProps {
  target: ShareTarget | null;
  defaultSenderName: string;
  onUpdateSenderName: (name: string) => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  target,
  defaultSenderName,
  onUpdateSenderName,
  onClose,
  onNotify,
}) => {
  const [format, setFormat] = useState<'zip' | 'json'>('zip');
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [permission, setPermission] = useState<SharePermission>('view');
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{
    filename: string;
    size: string;
    images: number;
  } | null>(null);

  useEffect(() => {
    if (!target) return;
    setSenderName(defaultSenderName);
    setLastResult(null);
    const hasImages = target.cards.some((c) => c.images.length > 0);
    setFormat(hasImages ? 'zip' : 'json');
  }, [target, defaultSenderName]);

  if (!target) return null;

  const totalImages = target.cards.reduce((sum, c) => sum + c.images.length, 0);
  const nativeShareAvailable = canUseNativeFileShare();

  const handleExport = async (mode: 'download' | 'native') => {
    setBusy(true);
    try {
      const trimmedSender = senderName.trim();
      if (trimmedSender !== defaultSenderName) {
        onUpdateSenderName(trimmedSender);
      }

      const options = {
        scope: target.scope,
        label: target.label,
        cards: target.cards,
        groups: target.groups,
        sharedBy: trimmedSender || undefined,
        permission,
      };

      const built =
        format === 'zip'
          ? await buildZipPackage(options)
          : buildJsonPackage(options);

      setLastResult({
        filename: built.filename,
        size: formatBytes(built.blob.size),
        images: built.bundledImages,
      });

      if (mode === 'native') {
        const outcome = await shareFileNative(
          built.blob,
          built.filename,
          `keepcard — ${target.label}`,
          `${target.cards.length} product card(s) shared via keepcard`
        );
        if (outcome === 'shared') {
          onNotify(`Shared ${built.filename}`);
        } else if (outcome === 'downloaded') {
          onNotify(`Downloaded ${built.filename}`);
        }
      } else {
        downloadBlob(built.blob, built.filename);
        onNotify(`Saved ${built.filename}`);
      }
    } catch {
      onNotify('Could not prepare export file. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Share {target.scope === 'card' ? 'Product Card' : target.scope === 'group' ? 'Group' : 'Catalog'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[290px]">
              {target.label} · {target.cards.length}{' '}
              {target.cards.length === 1 ? 'card' : 'cards'}
              {totalImages > 0 ? ` · ${totalImages} photos` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            aria-label="Close share modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('zip')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  format === 'zip'
                    ? 'border-[#15803D] bg-[#F0FDF4] ring-1 ring-[#15803D]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <FileArchive
                  className={`w-5 h-5 mb-1.5 ${
                    format === 'zip' ? 'text-[#15803D]' : 'text-slate-500'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-900">
                  ZIP Archive
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Bundles data.json + image files
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  format === 'json'
                    ? 'border-[#15803D] bg-[#F0FDF4] ring-1 ring-[#15803D]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <FileJson
                  className={`w-5 h-5 mb-1.5 ${
                    format === 'json' ? 'text-[#15803D]' : 'text-slate-500'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-900">
                  JSON File
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Single portable data file
                </span>
              </button>
            </div>
          </div>

          {/* Sender attribution & permission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Shared By (optional)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Name or email"
                className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Recipient Access
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as SharePermission)}
                className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#15803D]"
              >
                <option value="view">View Only</option>
                <option value="edit">Can Edit</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Recipients can open <strong className="text-slate-700">Settings → Import Data</strong> in keepcard to unzip or load this file directly into their catalog.
          </p>

          {lastResult && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
              <Check className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{lastResult.filename}</p>
                <p className="opacity-80 font-mono">
                  {lastResult.size}
                  {lastResult.images > 0 ? ` · ${lastResult.images} bundled photos` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleExport('download')}
              className="flex-1 h-11 px-4 rounded-xl bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download {format.toUpperCase()}</span>
            </button>

            {nativeShareAvailable && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleExport('native')}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share File</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
