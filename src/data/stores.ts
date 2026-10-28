import type { IssuuSource } from '../lib/issuu';
import type { StoreId } from '../types';

export interface Store {
  id: StoreId;
  name: string;
  /** Pages with current sales; Claude starts there. Empty: no sale checking. */
  salePages: string[];
  /** Extra hint for Claude about where the sales are. */
  hint?: string;
  /** Where the store's Issuu catalogs are; their pages are read as images. */
  issuu?: IssuuSource;
}

export const STORE_LIST: Store[] = [
  {
    id: 'bingo',
    name: 'Bingo',
    salePages: [
      'https://www.bingotuzla.ba/super-ponuda/',
      'https://www.bingotuzla.ba/kataloska-akcija-305/',
      'https://www.bingotuzla.ba/katalozi-u-bingu/',
    ],
    hint:
      'Product pages (bingotuzla.ba/proizvod/…) show the sale price and "Akcija vrijedi u periodu …". ' +
      'Catalogs are per region: on katalozi-u-bingu a city picker ("odaberi grad") links each city to its catalog; ' +
      'kataloska-akcija-305 is "Kataloška ponuda FBiH" (Sarajevo and most of the Federation), 306 is RS (incl. Istočno Sarajevo). ' +
      'The catalog is an Issuu flipbook (iframe e.issuu.com/embed.html?d=<doc>&u=<user>); the document page ' +
      'issuu.com/<user>/docs/<doc> contains image.isu.pub/<id>/jpg/page_1_… and "pageCount"; every page is ' +
      'https://image.isu.pub/<id>/jpg/page_<n>.jpg (n = 1…pageCount). Each offer has its own "Akcija vrijedi" dates.',
    // FBiH (Sarajevo); 306 would be RS.
    issuu: { page: 'https://www.bingotuzla.ba/kataloska-akcija-305/' },
  },
  {
    id: 'mercator',
    name: 'Mercator',
    salePages: ['https://www.mercator.ba/akcije/akcije-2', 'https://www.mercator.ba/akcije/katalozi/?kcity=1'],
    hint:
      'Sales (e.g. vikend akcija) are often published only as images or flyers. ' +
      'akcije/katalozi lists catalogs per city: pick the city in its "Odaberi grad" list (?kcity=<n>, Sarajevo = 1); ' +
      'without a city it lists none. Catalog versions differ by region (…-I = Sarajevo/Tuzla, -II = Mostar, -III = Banja Luka). ' +
      'Each catalog links an Issuu flipbook (issuu.com/mercator_bih/docs/<doc>); that page contains ' +
      'image.isu.pub/<id>/jpg/page_1_… and "pageCount"; every page is https://image.isu.pub/<id>/jpg/page_<n>.jpg. ' +
      'Food catalogs: "Kataloška ponuda" (redovni_katalog), "Pika pogodnosti", "Zaključane cijene".',
    issuu: {
      page: 'https://www.mercator.ba/akcije/katalozi/',
      cityPicker: true,
      docs: /redovni_katalog|pika_katalog|zaklju_ane_cijene/,
    },
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
