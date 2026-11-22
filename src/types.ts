export type StockStatus = 'In Stock' | 'Made to Order' | 'Out of Stock';

export type CardColorKey = 'white' | 'mint' | 'sand' | 'sky' | 'rose' | 'lavender';

export type CardStatus = 'active' | 'archived' | 'trashed';

export type SharePermission = 'edit' | 'view';

export type LayoutMode = 'grid' | 'list';

export type NavFilter =
  | { type: 'all' }
  | { type: 'pinned' }
  | { type: 'shared' }
  | { type: 'archive' }
  | { type: 'trash' }
  | { type: 'group'; groupId: string };

export interface ProductCard {
  id: string;
  title: string;
  sku: string;
  price: string;
  unit: string;
  specs: string[];
  stockStatus: StockStatus;
  images: string[];
  groupId: string | null;
  color: CardColorKey;
  pinned: boolean;
  status: CardStatus;
  sharedBy?: string;
  permission: SharePermission;
  createdAt: number;
  updatedAt: number;
}

export interface ProductGroup {
  id: string;
  name: string;
  sharedBy?: string;
  createdAt: number;
}

export interface AppSettings {
  showPrices: boolean;
  pricePrefix: string;
  senderName: string;
  layoutMode: LayoutMode;
}

export interface KeepCardPackage {
  format: 'keepcard-package';
  version: 1;
  exportedAt: string;
  scope: 'card' | 'group' | 'catalog';
  sharedBy?: string;
  permission: SharePermission;
  groups: ProductGroup[];
  cards: ProductCard[];
}

export interface ImportPreview {
  sourceType: 'json' | 'zip';
  fileName: string;
  fileSizeBytes: number;
  cards: ProductCard[];
  groups: ProductGroup[];
  extractedImageCount: number;
  sharedBy?: string;
  permission: SharePermission;
  exportedAt?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  showPrices: true,
  pricePrefix: '',
  senderName: '',
  layoutMode: 'grid',
};

export const CARD_COLORS: Record<
  CardColorKey,
  {
    label: string;
    surfaceClass: string;
    swatchClass: string;
    topBarClass: string;
  }
> = {
  white: {
    label: 'Pure White',
    surfaceClass: 'bg-white border-slate-200/90',
    swatchClass: 'bg-white border-slate-300',
    topBarClass: 'bg-transparent',
  },
  mint: {
    label: 'Fresh Mint',
    surfaceClass: 'bg-[#F3FAF5] border-[#CDEBD6]',
    swatchClass: 'bg-[#DCFCE7] border-[#86EFAC]',
    topBarClass: 'bg-[#15803D]',
  },
  sand: {
    label: 'Warm Sand',
    surfaceClass: 'bg-[#FBF8F3] border-[#EAE0D0]',
    swatchClass: 'bg-[#F5EBD9] border-[#D8C5A6]',
    topBarClass: 'bg-[#B45309]',
  },
  sky: {
    label: 'Cool Mist',
    surfaceClass: 'bg-[#F4F8FC] border-[#D5E3F2]',
    swatchClass: 'bg-[#E0F2FE] border-[#93C5FD]',
    topBarClass: 'bg-[#0369A1]',
  },
  rose: {
    label: 'Soft Blush',
    surfaceClass: 'bg-[#FCF5F7] border-[#F0D5DE]',
    swatchClass: 'bg-[#FCE7F3] border-[#F9A8D4]',
    topBarClass: 'bg-[#BE123C]',
  },
  lavender: {
    label: 'Calm Slate',
    surfaceClass: 'bg-[#F6F5FC] border-[#DDD9F3]',
    swatchClass: 'bg-[#EDE9FE] border-[#C4B5FD]',
    topBarClass: 'bg-[#6D28D9]',
  },
};

export const STOCK_STATUS_OPTIONS: StockStatus[] = [
  'In Stock',
  'Made to Order',
  'Out of Stock',
];
