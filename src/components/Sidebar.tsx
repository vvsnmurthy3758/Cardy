import React, { useState } from 'react';
import {
  Archive,
  Folder,
  FolderPlus,
  LayoutGrid,
  Pin,
  Settings,
  Share2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { NavFilter, ProductCard, ProductGroup } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  activeFilter: NavFilter;
  onSelectFilter: (filter: NavFilter) => void;
  groups: ProductGroup[];
  cards: ProductCard[];
  onCreateGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onShareGroup: (group: ProductGroup) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  activeFilter,
  onSelectFilter,
  groups,
  cards,
  onCreateGroup,
  onDeleteGroup,
  onShareGroup,
  onOpenSettings,
}) => {
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const activeCards = cards.filter((c) => c.status === 'active');
  const pinnedCount = activeCards.filter((c) => c.pinned).length;
  const sharedCount = activeCards.filter((c) => Boolean(c.sharedBy)).length;
  const archiveCount = cards.filter((c) => c.status === 'archived').length;
  const trashCount = cards.filter((c) => c.status === 'trashed').length;

  const isSelected = (type: NavFilter['type'], groupId?: string) => {
    if (activeFilter.type !== type) return false;
    if (type === 'group' && activeFilter.type === 'group') {
      return activeFilter.groupId === groupId;
    }
    return true;
  };

  const handleSelect = (filter: NavFilter) => {
    onSelectFilter(filter);
    onCloseMobile();
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    onCreateGroup(trimmed);
    setNewGroupName('');
    setCreatingGroup(false);
  };

  const navItemClass = (active: boolean) =>
    `w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-[#DCFCE7] text-[#15803D] font-semibold'
        : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 lg:hidden">
        <span className="font-display font-bold text-slate-900">Navigation</span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button
          type="button"
          onClick={() => handleSelect({ type: 'all' })}
          className={navItemClass(isSelected('all'))}
        >
          <span className="flex items-center gap-3 min-w-0">
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="truncate">All Products</span>
          </span>
          <span className="font-mono text-xs tabular-nums opacity-70">
            {activeCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect({ type: 'pinned' })}
          className={navItemClass(isSelected('pinned'))}
        >
          <span className="flex items-center gap-3 min-w-0">
            <Pin className="w-4 h-4 shrink-0" />
            <span className="truncate">Pinned</span>
          </span>
          {pinnedCount > 0 && (
            <span className="font-mono text-xs tabular-nums opacity-70">
              {pinnedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSelect({ type: 'shared' })}
          className={navItemClass(isSelected('shared'))}
        >
          <span className="flex items-center gap-3 min-w-0">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Shared with Me</span>
          </span>
          {sharedCount > 0 && (
            <span className="font-mono text-xs tabular-nums opacity-70">
              {sharedCount}
            </span>
          )}
        </button>

        {/* Groups / Collections */}
        <div className="pt-5 pb-1">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-xs font-semibold text-slate-400 tracking-tight">
              Groups &amp; Collections
            </span>
            <button
              type="button"
              onClick={() => setCreatingGroup((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] hover:text-[#166534] px-1.5 py-1 rounded-md hover:bg-[#F0FDF4] transition-colors cursor-pointer whitespace-nowrap"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {creatingGroup && (
            <form onSubmit={handleAddGroupSubmit} className="px-2 pb-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Collection name..."
                  className="flex-1 min-w-0 h-9 px-2.5 rounded-lg border border-slate-200 bg-[#F8FAFC] text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#15803D]"
                />
                <button
                  type="submit"
                  className="h-9 px-2.5 rounded-lg bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {groups.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                No groups yet. Create one to organize products.
              </p>
            ) : (
              groups.map((group) => {
                const count = activeCards.filter(
                  (c) => c.groupId === group.id
                ).length;
                const active = isSelected('group', group.id);
                return (
                  <div
                    key={group.id}
                    className={`group flex items-center rounded-xl transition-colors ${
                      active
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'text-slate-700 hover:bg-slate-100/90'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleSelect({ type: 'group', groupId: group.id })
                      }
                      className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left cursor-pointer"
                    >
                      <Folder className="w-4 h-4 shrink-0" />
                      <span className="truncate">{group.name}</span>
                    </button>

                    <div className="flex items-center pr-1.5 gap-0.5 shrink-0">
                      <span className="font-mono text-xs tabular-nums opacity-65 px-1 group-hover:hidden">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareGroup(group);
                        }}
                        className="hidden group-hover:flex w-7 h-7 items-center justify-center rounded-lg text-slate-500 hover:text-[#15803D] hover:bg-white/80 cursor-pointer"
                        title={`Share ${group.name}`}
                        aria-label={`Share ${group.name}`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                        className="hidden group-hover:flex w-7 h-7 items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white/80 cursor-pointer"
                        title={`Delete ${group.name}`}
                        aria-label={`Delete ${group.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Archive & Trash */}
        <div className="pt-4 border-t border-slate-100 space-y-1">
          <button
            type="button"
            onClick={() => handleSelect({ type: 'archive' })}
            className={navItemClass(isSelected('archive'))}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Archive className="w-4 h-4 shrink-0" />
              <span className="truncate">Archive</span>
            </span>
            {archiveCount > 0 && (
              <span className="font-mono text-xs tabular-nums opacity-70">
                {archiveCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelect({ type: 'trash' })}
            className={navItemClass(isSelected('trash'))}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Trash</span>
            </span>
            {trashCount > 0 && (
              <span className="font-mono text-xs tabular-nums opacity-70">
                {trashCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Bottom Settings & Data Portability shortcut */}
      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenSettings();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="truncate">Settings &amp; Import ZIP</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={`hidden lg:block fixed top-16 bottom-0 left-0 z-20 transition-transform duration-200 w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-slate-900/40 backdrop-blur-xs"
          onClick={onCloseMobile}
        >
          <aside
            className="w-72 max-w-[85vw] h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
