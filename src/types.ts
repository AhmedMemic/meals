export const UNITS = [
  'kom',
  'g',
  'kg',
  'ml',
  'l',
  'kašika',
  'kašičica',
  'glavica',
  'vezica',
  'čaša',
  'konzerva',
  'paket',
] as const;
export type Unit = (typeof UNITS)[number];

export type CategoryId =
  | 'povrce'
  | 'voce'
  | 'pekara'
  | 'mlijecni'
  | 'delikatese'
  | 'meso'
  | 'smrznuto'
  | 'suhe'
  | 'konzerve'
  | 'zacini'
  | 'slatko'
  | 'pice'
  | 'beba'
  | 'higijena'
  | 'kucna'
  | 'ostalo';

export interface Category {
  id: CategoryId;
  name: string;
  order: number;
}

/** A quantity; amount null means "some" (e.g. so, biber). */
export interface Qty {
  amount: number | null;
  unit: Unit;
}

export interface Ingredient extends Qty {
  name: string;
  category: CategoryId;
}

export const MEAL_KINDS = ['corba', 'kuhano', 'peceno', 'pita', 'svakodnevno', 'dorucak', 'salata', 'slatko', 'beba'] as const;
export type MealKind = (typeof MEAL_KINDS)[number];

export interface Meal {
  id: string;
  name: string;
  kind: MealKind;
  /** How many days one cooking usually lasts (pita, čorba: 2–3). */
  days: number;
  ingredients: Ingredient[];
  notes: string;
  favourite: boolean;
  hidden: boolean;
  forBaby: boolean;
  builtin: boolean;
}

export const SLOTS = ['dorucak', 'rucak', 'vecera', 'beba'] as const;
export type Slot = (typeof SLOTS)[number];

export interface PlanEntry {
  id?: number;
  /** Local date, YYYY-MM-DD. */
  date: string;
  slot: Slot;
  mealId: string;
  /** Leftovers: shown in the plan, adds nothing to the list. */
  leftover: boolean;
  /** For auto-created leftovers: the entry that was cooked. */
  sourceId?: number;
  /** Ingredients were already added to the shopping list. */
  inList: boolean;
}

export interface SavedWeekEntry {
  /** 0 = Monday … 6 = Sunday. */
  day: number;
  slot: Slot;
  mealId: string;
  leftover: boolean;
}

export interface SavedWeek {
  id?: number;
  name: string;
  entries: SavedWeekEntry[];
}

export interface ListItem {
  id?: number;
  name: string;
  /** Normalised name, used to merge items. */
  key: string;
  category: CategoryId;
  qty: Qty[];
  /** Meal names this item came from. */
  sources: string[];
  checked: boolean;
  /** Basic item (so, ulje…): shown under "Provjeri kod kuće". */
  staple: boolean;
  createdAt: number;
}

export type QuickGroup = 'dorucak' | 'beba';

/** Known store items: starter catalog plus everything ever added. */
export interface CatalogItem {
  key: string;
  name: string;
  category: CategoryId;
  unit?: Unit;
  staple: boolean;
  groups: QuickGroup[];
  useCount: number;
  lastUsed: number;
}

export const STORES = ['bingo', 'mercator', 'konzum', 'penny', 'pijaca', 'ostalo'] as const;
export type StoreId = (typeof STORES)[number];

/** A price we paid or saw: from a receipt photo or typed by hand. */
export interface PriceRecord {
  id?: number;
  /** Catalog key of the item (normalised name). */
  key: string;
  /** Name as it was on the receipt. */
  name: string;
  store: StoreId;
  /** KM per `unit`. */
  price: number;
  /** What the price is for, e.g. "kg", "1 l", "kom", "500 g". */
  unit: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  source: 'racun' | 'rucno';
}

/** A sale offer read from a store's website or catalog. */
export interface Deal {
  id?: number;
  store: StoreId;
  name: string;
  /** Sale price in KM. */
  price: number;
  oldPrice: number | null;
  /** What the price is for, e.g. "kg", "1 l", "kom". */
  unit: string;
  validFrom: string | null;
  validTo: string | null;
  /** Matching catalog key, if the item is one we know. */
  key: string | null;
  category: CategoryId | null;
  fetchedAt: number;
}
