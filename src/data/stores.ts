import type { StoreId } from '../types';

export interface Store {
  id: StoreId;
  name: string;
  /** Pages with current sales; Claude starts there. Empty: no sale checking. */
  salePages: string[];
  /** Extra hint for Claude about where the sales are. */
  hint?: string;
}

export const STORE_LIST: Store[] = [
  {
    id: 'bingo',
    name: 'Bingo',
    salePages: ['https://www.bingotuzla.ba/super-ponuda/', 'https://www.bingotuzla.ba/katalozi-u-bingu/'],
    hint: 'Product pages (bingotuzla.ba/proizvod/…) show the sale price and "Akcija vrijedi u periodu …".',
  },
  {
    id: 'mercator',
    name: 'Mercator',
    salePages: ['https://www.mercator.ba/akcije/akcije-2', 'https://www.mercator.ba/akcije/katalozi'],
    hint: 'Sales (e.g. vikend akcija) are often published only as images or flyers.',
  },
  {
    id: 'konzum',
    name: 'Konzum',
    salePages: [],
    hint: 'konzum.ba may not load; search the web for the current Konzum BiH katalog / akcije.',
  },
  {
    id: 'penny',
    name: 'Penny',
    salePages: ['https://pennyshop.ba/shop/badge/akcija-8', 'https://pennyshop.ba/shop/penny-plus/prehrana'],
    hint: 'Penny Plus also sells hardware and tools; only food and household items matter.',
  },
  { id: 'pijaca', name: 'Pijaca', salePages: [] },
  { id: 'ostalo', name: 'Ostalo', salePages: [] },
];

export const STORES_BY_ID = new Map(STORE_LIST.map((s) => [s.id, s]));

/** Stores whose sales can be checked online. */
export const SALE_STORES = STORE_LIST.filter((s) => s.id !== 'pijaca' && s.id !== 'ostalo');

export function storeName(id: StoreId): string {
  return STORES_BY_ID.get(id)?.name ?? id;
}
