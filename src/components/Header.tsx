import React from 'react';
import {
  LayoutGrid,
  List,
  Menu,
  Search,
  Settings,
  Share2,
  X,
} from 'lucide-react';
import { LayoutMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layoutMode: LayoutMode;
  onToggleLayout: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onShareCatalog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  layoutMode,
  onToggleLayout,
  onToggleSidebar,
  onOpenSettings,
  onShareCatalog,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between gap-3 sm:gap-6">
      {/* Left: Menu trigger + Brand wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-lg bg-[#15803D] flex items-center justify-center shadow-xs shrink-0">
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" aria-hidden="true">
              <rect x="4" y="5" width="10.5" height="14" rx="2.2" fill="#FFFFFF" />
              <rect x="17.5" y="5" width="10.5" height="9.5" rx="2.2" fill="#DCFCE7" />
              <rect x="17.5" y="17" width="10.5" height="10" rx="2.2" fill="#FFFFFF" />
              <rect x="4" y="21.5" width="10.5" height="5.5" rx="2" fill="#86EFAC" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            keepcard
          </span>
        </div>
      </div>

      {/* Center: Instant search */}
      <div className="flex-1 max-w-2xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, SKU, group, or specs..."
            aria-label="Search products"
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#F8FAFC] border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Layout toggle, Share, Install, Settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        <PWAInstallButton />

        <button
          type="button"
          onClick={onToggleLayout}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title={layoutMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          aria-label={layoutMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          {layoutMode === 'grid' ? (
            <List className="w-5 h-5" />
          ) : (
            <LayoutGrid className="w-5 h-5" />
          )}
        </button>

        <button
          type="button"
          onClick={onShareCatalog}
          className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-slate-700 hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Share or export catalog as JSON or ZIP"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center justify-center gap-1.5 w-10 sm:w-auto sm:px-3.5 h-10 rounded-lg bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          title="Settings, pricing options, and import/unzip data"
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};
