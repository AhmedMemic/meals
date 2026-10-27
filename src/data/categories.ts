import type { Category } from '../types';

// Default order roughly follows a walk through the store; editable in the app.
export const STARTER_CATEGORIES: Category[] = [
  { id: 'povrce', name: 'Povrće', order: 0 },
  { id: 'voce', name: 'Voće', order: 1 },
  { id: 'pekara', name: 'Pekara', order: 2 },
  { id: 'mlijecni', name: 'Mliječni proizvodi i jaja', order: 3 },
  { id: 'delikatese', name: 'Delikatese', order: 4 },
  { id: 'meso', name: 'Meso i riba', order: 5 },
  { id: 'smrznuto', name: 'Smrznuto', order: 6 },
  { id: 'suhe', name: 'Tjestenina, riža i brašno', order: 7 },
  { id: 'konzerve', name: 'Konzerve i tegle', order: 8 },
  { id: 'zacini', name: 'Začini, ulje i umaci', order: 9 },
  { id: 'slatko', name: 'Slatkiši i grickalice', order: 10 },
  { id: 'pice', name: 'Piće', order: 11 },
  { id: 'beba', name: 'Beba', order: 12 },
  { id: 'higijena', name: 'Higijena', order: 13 },
  { id: 'kucna', name: 'Kućna hemija', order: 14 },
  { id: 'ostalo', name: 'Ostalo', order: 15 },
];
