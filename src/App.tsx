import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  FolderOpen,
  FolderUp,
  PackageOpen,
  Pin,
  Search,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import {
  AppSettings,
  CardColorKey,
  DEFAULT_SETTINGS,
  ImportPreview,
  NavFilter,
  ProductCard,
  ProductGroup,
} from './types';
import {
  deleteCardFromDB,
  deleteGroupFromDB,
  initDatabase,
  replaceCatalogInDB,
  resetToSampleCatalog,
  saveCardsBulkToDB,
  saveCardToDB,
  saveGroupsBulkToDB,
  saveGroupToDB,
  saveSettingsToDB,
} from './lib/db';
import { generateId } from './lib/portability';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuickCreateBar } from './components/QuickCreateBar';
import { ProductCardTile } from './components/ProductCardTile';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ShareModal, ShareTarget } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [storageEngine, setStorageEngine] = useState<'indexeddb' | 'localstorage'>(
    'indexeddb'
  );
  const [cards, setCards] = useState<ProductCard[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [activeFilter, setActiveFilter] = useState<NavFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCard, setSelectedCard] = useState<{
    card: ProductCard;
    editMode: boolean;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [settingsState, setSettingsState] = useState<{
    open: boolean;
    tab: 'pricing' | 'import' | 'data';
  }>({ open: false, tab: 'pricing' });
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    initDatabase().then((snapshot) => {
      if (!mounted) return;
      setCards(snapshot.cards);
      setGroups(snapshot.groups);
      setSettings(snapshot.settings);
      setStorageEngine(snapshot.storageEngine);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const groupMap = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    for (const g of groups) map.set(g.id, g);
    return map;
  }, [groups]);

  const updateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettingsToDB(next);
  };

  const handleToggleLayout = () => {
    updateSettings({
      ...settings,
      layoutMode: settings.layoutMode === 'grid' ? 'list' : 'grid',
    });
  };

  const handleCreateGroup = (name: string): ProductGroup => {
    const group: ProductGroup = {
      id: generateId('grp'),
      name,
      createdAt: Date.now(),
    };
    setGroups((prev) => [...prev, group]);
    saveGroupToDB(group);
    notify(`Created group "${name}"`);
    return group;
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groupMap.get(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    deleteGroupFromDB(groupId);

    const affectedCards = cards
      .filter((c) => c.groupId === groupId)
      .map((c) => ({ ...c, groupId: null, updatedAt: Date.now() }));
    if (affectedCards.length > 0) {
      setCards((prev) =>
        prev.map((c) => (c.groupId === groupId ? { ...c, groupId: null } : c))
      );
      saveCardsBulkToDB(affectedCards);
    }

    if (activeFilter.type === 'group' && activeFilter.groupId === groupId) {
      setActiveFilter({ type: 'all' });
    }
    if (group) notify(`Deleted group "${group.name}"`);
  };

  const handleCreateCard = (card: ProductCard) => {
    setCards((prev) => [card, ...prev]);
    saveCardToDB(card);
    notify(`Saved "${card.title}"`);
  };

  const handleUpdateCard = (updated: ProductCard) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    saveCardToDB(updated);
    setSelectedCard((prev) =>
      prev && prev.card.id === updated.id ? { ...prev, card: updated } : prev
    );
    notify('Card updated');
  };

  const handleTogglePin = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;
    const updated: ProductCard = {
      ...target,
      pinned: !target.pinned,
      updatedAt: Date.now(),
    };
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    saveCardToDB(updated);
  };

  const handleChangeColor = (cardId: string, color: CardColorKey) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target || target.permission === 'view') return;
    const updated: ProductCard = {
      ...target,
      color,
      updatedAt: Date.now(),
    };
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    saveCardToDB(updated);
  };

  const handleArchiveCard = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;
    const updated: ProductCard = {
      ...target,
      status: 'archived',
      pinned: false,
      updatedAt: Date.now(),
    };
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    saveCardToDB(updated);
    notify('Card archived');
  };

  const handleTrashCard = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;
    const updated: ProductCard = {
      ...target,
      status: 'trashed',
      pinned: false,
      updatedAt: Date.now(),
    };
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    saveCardToDB(updated);
    notify('Moved to Trash');
  };

  const handleRestoreCard = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;
    const updated: ProductCard = {
      ...target,
      status: 'active',
      updatedAt: Date.now(),
    };
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    saveCardToDB(updated);
    notify('Card restored');
  };

  const handleDeleteForever = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    deleteCardFromDB(cardId);
    notify('Deleted permanently');
  };

  const handleEmptyTrash = () => {
    const trashedIds = cards.filter((c) => c.status === 'trashed').map((c) => c.id);
    if (trashedIds.length === 0) return;
    setCards((prev) => prev.filter((c) => c.status !== 'trashed'));
    for (const id of trashedIds) deleteCardFromDB(id);
    notify(`Permanently deleted ${trashedIds.length} card(s)`);
  };

  const handleShareCard = (card: ProductCard) => {
    const relatedGroup = card.groupId ? groupMap.get(card.groupId) : undefined;
    setShareTarget({
      scope: 'card',
      label: card.title,
      cards: [card],
      groups: relatedGroup ? [relatedGroup] : [],
    });
  };

  const handleShareGroup = (group: ProductGroup) => {
    const groupCards = cards.filter(
      (c) => c.status === 'active' && c.groupId === group.id
    );
    setShareTarget({
      scope: 'group',
      label: group.name,
      cards: groupCards,
      groups: [group],
    });
  };

  const handleShareCatalog = () => {
    const activeCards = cards.filter((c) => c.status === 'active');
    setShareTarget({
      scope: 'catalog',
      label: 'Full Catalog',
      cards: activeCards,
      groups,
    });
  };

  const handleBulkUpdatePrice = ({
    scope,
    price,
    unit,
    clear,
  }: {
    scope: 'all' | 'missing' | string;
    price: string;
    unit: string;
    clear: boolean;
  }) => {
    const now = Date.now();
    const updatedCards: ProductCard[] = [];

    const nextCards = cards.map((card) => {
      if (card.status !== 'active' || card.permission === 'view') return card;
      const matchesScope =
        scope === 'all' ||
        (scope === 'missing' && card.price.trim() === '') ||
        card.groupId === scope;
      if (!matchesScope) return card;

      const mutated: ProductCard = {
        ...card,
        price: clear ? '' : price,
        unit: clear ? '' : unit || card.unit,
        updatedAt: now,
      };
      updatedCards.push(mutated);
      return mutated;
    });

    if (updatedCards.length === 0) {
      notify('No matching editable cards to update.');
      return;
    }

    setCards(nextCards);
    saveCardsBulkToDB(updatedCards);

    if (!clear && !settings.showPrices) {
      updateSettings({ ...settings, showPrices: true });
    }

    notify(
      clear
        ? `Cleared prices on ${updatedCards.length} card(s)`
        : `Updated price on ${updatedCards.length} card(s)`
    );
  };

  const handleConfirmImport = async (
    preview: ImportPreview,
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      setCards(preview.cards);
      setGroups(preview.groups);
      await replaceCatalogInDB(preview.cards, preview.groups);
      setSettingsState((s) => ({ ...s, open: false }));
      notify(
        `Replaced catalog with ${preview.cards.length} card(s) from ${preview.fileName}`
      );
      return;
    }

    // Merge mode: preserve existing data and map group IDs cleanly
    const mergedGroupsMap = new Map(groups.map((g) => [g.id, g]));
    for (const g of preview.groups) {
      if (!mergedGroupsMap.has(g.id)) {
        mergedGroupsMap.set(g.id, g);
      }
    }
    const mergedGroups = Array.from(mergedGroupsMap.values());

    const mergedCardsMap = new Map(cards.map((c) => [c.id, c]));
    for (const incoming of preview.cards) {
      mergedCardsMap.set(incoming.id, {
        ...incoming,
        status: incoming.status || 'active',
        updatedAt: Date.now(),
      });
    }
    const mergedCards = Array.from(mergedCardsMap.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    setGroups(mergedGroups);
    setCards(mergedCards);
    await saveGroupsBulkToDB(preview.groups);
    await saveCardsBulkToDB(preview.cards);
    setSettingsState((s) => ({ ...s, open: false }));

    if (preview.sharedBy) {
      setActiveFilter({ type: 'shared' });
    }
    notify(
      `Imported ${preview.cards.length} card(s)${
        preview.extractedImageCount > 0
          ? ` and ${preview.extractedImageCount} unzipped photo(s)`
          : ''
      }`
    );
  };

  const handleResetSampleData = async () => {
    const sample = await resetToSampleCatalog();
    setCards(sample.cards);
    setGroups(sample.groups);
    setActiveFilter({ type: 'all' });
    notify('Restored sample catalog');
  };

  // Compute filtered cards
  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return cards.filter((card) => {
      // Section filter
      if (activeFilter.type === 'archive') {
        if (card.status !== 'archived') return false;
      } else if (activeFilter.type === 'trash') {
        if (card.status !== 'trashed') return false;
      } else {
        if (card.status !== 'active') return false;
        if (activeFilter.type === 'pinned' && !card.pinned) return false;
        if (activeFilter.type === 'shared' && !card.sharedBy) return false;
        if (
          activeFilter.type === 'group' &&
          card.groupId !== activeFilter.groupId
        ) {
          return false;
        }
      }

      // Instant search across title, SKU, group name, specs, and sharedBy
      if (query) {
        const gName = card.groupId
          ? groupMap.get(card.groupId)?.name.toLowerCase() ?? ''
          : '';
        const haystack = [
          card.title,
          card.sku,
          gName,
          card.stockStatus,
          card.sharedBy ?? '',
          ...card.specs,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [cards, activeFilter, searchQuery, groupMap]);

  const showPinnedSplit =
    activeFilter.type !== 'archive' &&
    activeFilter.type !== 'trash' &&
    activeFilter.type !== 'pinned';

  const pinnedCards = showPinnedSplit
    ? filteredCards.filter((c) => c.pinned)
    : [];
  const otherCards = showPinnedSplit
    ? filteredCards.filter((c) => !c.pinned)
    : filteredCards;

  const activeGroup =
    activeFilter.type === 'group'
      ? groupMap.get(activeFilter.groupId) ?? null
      : null;

  const sectionHeading = (() => {
    switch (activeFilter.type) {
      case 'all':
        return 'All Products';
      case 'pinned':
        return 'Pinned Products';
      case 'shared':
        return 'Shared with Me';
      case 'archive':
        return 'Archive';
      case 'trash':
        return 'Trash';
      case 'group':
        return activeGroup?.name ?? 'Group';
    }
  })();

  const gridContainerClass =
    settings.layoutMode === 'grid'
      ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5'
      : 'flex flex-col gap-3 max-w-4xl mx-auto';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        layoutMode={settings.layoutMode}
        onToggleLayout={handleToggleLayout}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenSettings={() => setSettingsState({ open: true, tab: 'pricing' })}
        onShareCatalog={handleShareCatalog}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        groups={groups}
        cards={cards}
        onCreateGroup={handleCreateGroup}
        onDeleteGroup={handleDeleteGroup}
        onShareGroup={handleShareGroup}
        onOpenSettings={() => setSettingsState({ open: true, tab: 'import' })}
      />

      <main
        className={`pt-20 pb-16 px-3.5 sm:px-6 lg:px-8 transition-[margin] duration-200 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Quick Create Bar on active catalog views */}
          {activeFilter.type !== 'archive' &&
            activeFilter.type !== 'trash' &&
            activeFilter.type !== 'shared' && (
              <QuickCreateBar
                groups={groups}
                defaultGroupId={activeGroup?.id ?? null}
                settings={settings}
                onCreateCard={handleCreateCard}
                onCreateGroup={handleCreateGroup}
                onNotify={notify}
              />
            )}

          {/* Contextual Section Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900 truncate">
                {sectionHeading}
              </h1>
              <span className="font-mono text-xs tabular-nums text-slate-400">
                {filteredCards.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeGroup && (
                <button
                  type="button"
                  onClick={() => handleShareGroup(activeGroup)}
                  className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#15803D] hover:text-[#15803D] inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Group</span>
                </button>
              )}

              {activeFilter.type === 'shared' && (
                <button
                  type="button"
                  onClick={() => setSettingsState({ open: true, tab: 'import' })}
                  className="h-9 px-3.5 rounded-xl bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>Import Shared ZIP / JSON</span>
                </button>
              )}

              {activeFilter.type === 'trash' && filteredCards.length > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="h-9 px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Trash</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            /* Empty States */
            <div className="flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs mb-4">
                {searchQuery ? (
                  <Search className="w-6 h-6" />
                ) : activeFilter.type === 'pinned' ? (
                  <Pin className="w-6 h-6" />
                ) : activeFilter.type === 'shared' ? (
                  <Users className="w-6 h-6" />
                ) : activeFilter.type === 'archive' ? (
                  <Archive className="w-6 h-6" />
                ) : activeFilter.type === 'trash' ? (
                  <Trash2 className="w-6 h-6" />
                ) : activeFilter.type === 'group' ? (
                  <FolderOpen className="w-6 h-6" />
                ) : (
                  <PackageOpen className="w-6 h-6" />
                )}
              </div>
              <h2 className="font-display text-base font-bold text-slate-900">
                {searchQuery
                  ? `No products matching "${searchQuery}"`
                  : activeFilter.type === 'shared'
                  ? 'No shared cards yet'
                  : activeFilter.type === 'pinned'
                  ? 'No pinned products'
                  : activeFilter.type === 'archive'
                  ? 'Your archive is empty'
                  : activeFilter.type === 'trash'
                  ? 'Trash is empty'
                  : 'No product cards here yet'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                {searchQuery
                  ? 'Try searching a different title, SKU code, group name, or specification keyword.'
                  : activeFilter.type === 'shared'
                  ? 'Import a shared .zip or .json file from Settings to view cards shared by colleagues.'
                  : 'Use the quick bar above to capture your first product card with photos and specs.'}
              </p>
              {activeFilter.type === 'shared' && !searchQuery && (
                <button
                  type="button"
                  onClick={() => setSettingsState({ open: true, tab: 'import' })}
                  className="mt-4 h-10 px-4 rounded-xl bg-[#15803D] text-white text-xs font-semibold hover:bg-[#166534] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Import ZIP or JSON</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* PINNED section */}
              {pinnedCards.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Pin className="w-3.5 h-3.5 text-[#15803D]" />
                    <h2 className="text-xs font-semibold text-slate-500 tracking-wide">
                      Pinned
                    </h2>
                  </div>
                  <div className={gridContainerClass}>
                    {pinnedCards.map((card) => (
                      <ProductCardTile
                        key={card.id}
                        card={card}
                        groupName={
                          card.groupId ? groupMap.get(card.groupId)?.name : undefined
                        }
                        settings={settings}
                        layoutMode={settings.layoutMode}
                        onOpen={(c, editMode) =>
                          setSelectedCard({ card: c, editMode: Boolean(editMode) })
                        }
                        onTogglePin={handleTogglePin}
                        onChangeColor={handleChangeColor}
                        onShare={handleShareCard}
                        onArchive={handleArchiveCard}
                        onTrash={handleTrashCard}
                        onRestore={handleRestoreCard}
                        onDeleteForever={handleDeleteForever}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* OTHERS (or single flat section for Archive/Trash/Pinned) */}
              {otherCards.length > 0 && (
                <section>
                  {pinnedCards.length > 0 && (
                    <h2 className="text-xs font-semibold text-slate-500 tracking-wide mb-3">
                      Others
                    </h2>
                  )}
                  <div className={gridContainerClass}>
                    {otherCards.map((card) => (
                      <ProductCardTile
                        key={card.id}
                        card={card}
                        groupName={
                          card.groupId ? groupMap.get(card.groupId)?.name : undefined
                        }
                        settings={settings}
                        layoutMode={settings.layoutMode}
                        onOpen={(c, editMode) =>
                          setSelectedCard({ card: c, editMode: Boolean(editMode) })
                        }
                        onTogglePin={handleTogglePin}
                        onChangeColor={handleChangeColor}
                        onShare={handleShareCard}
                        onArchive={handleArchiveCard}
                        onTrash={handleTrashCard}
                        onRestore={handleRestoreCard}
                        onDeleteForever={handleDeleteForever}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProductDetailModal
        card={selectedCard?.card ?? null}
        initialEditMode={selectedCard?.editMode ?? false}
        groups={groups}
        settings={settings}
        onClose={() => setSelectedCard(null)}
        onSave={handleUpdateCard}
        onShare={handleShareCard}
        onArchive={handleArchiveCard}
        onTrash={handleTrashCard}
      />

      <ShareModal
        target={shareTarget}
        defaultSenderName={settings.senderName}
        onUpdateSenderName={(senderName) =>
          updateSettings({ ...settings, senderName })
        }
        onClose={() => setShareTarget(null)}
        onNotify={notify}
      />

      <SettingsModal
        isOpen={settingsState.open}
        initialTab={settingsState.tab}
        settings={settings}
        cards={cards}
        groups={groups}
        storageEngine={storageEngine}
        onClose={() => setSettingsState((s) => ({ ...s, open: false }))}
        onUpdateSettings={updateSettings}
        onBulkUpdatePrice={handleBulkUpdatePrice}
        onConfirmImport={handleConfirmImport}
        onShareCatalog={handleShareCatalog}
        onResetSampleData={handleResetSampleData}
      />

      {/* Offline PWA indicator */}
      <OfflineIndicator />

      {/* Confirmation Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-medium shadow-xl border border-slate-800"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
