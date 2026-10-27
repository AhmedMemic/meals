import type { Ingredient, Meal, MealKind, Unit } from '../types';
import { normalizeKey } from '../lib/units';
import { STARTER_CATALOG } from './catalog';

// Amounts are for the whole pot / tray for our family (2 adults), not per person.
// Ingredient names must match a catalog item (checked by a test), so the
// category comes from the catalog and the same ingredient always merges.

const byKey = new Map(STARTER_CATALOG.map((c) => [normalizeKey(c.name), c]));

function i(name: string, amount: number, unit: Unit): Ingredient {
  return { name, amount, unit, category: byKey.get(normalizeKey(name))?.category ?? 'ostalo' };
}

/** "Some" of a basic item (so, biber, ulje…). */
function z(...names: string[]): Ingredient[] {
  return names.map((name) => {
    const c = byKey.get(normalizeKey(name));
    return { name, amount: null, unit: c?.unit ?? 'kom', category: c?.category ?? 'ostalo' };
  });
}

interface Opts {
  days?: number;
  forBaby?: boolean;
  notes?: string;
}

function m(id: string, name: string, kind: MealKind, ingredients: Ingredient[], opts: Opts = {}): Meal {
  return {
    id: `s-${id}`,
    name,
    kind,
    days: opts.days ?? 1,
    ingredients,
    notes: opts.notes ?? '',
    favourite: false,
    hidden: false,
    forBaby: opts.forBaby ?? false,
    builtin: true,
  };
}

export const STARTER_MEALS: Meal[] = [
  // Čorbe i supe
  m('begova-corba', 'Begova čorba', 'corba', [
    i('Pileći batak i karabatak', 0.6, 'kg'), i('Mrkva', 2, 'kom'), i('Korijen peršuna', 1, 'kom'), i('Celer', 1, 'kom'),
    i('Luk', 1, 'kom'), i('Kiselo vrhnje', 1, 'kom'), i('Jaja', 1, 'kom'), i('Limun', 1, 'kom'), i('Maslac', 50, 'g'),
    ...z('Brašno', 'So', 'Biber', 'Vegeta'),
  ], { days: 2 }),
  m('pileca-supa', 'Pileća supa', 'corba', [
    i('Piletina za supu', 500, 'g'), i('Mrkva', 2, 'kom'), i('Korijen peršuna', 1, 'kom'), i('Luk', 1, 'kom'),
    i('Rezanci za supu', 200, 'g'), ...z('So', 'Vegeta', 'Biber'),
  ], { days: 2, forBaby: true }),
  m('govedja-supa', 'Goveđa supa', 'corba', [
    i('Govedina s kosti', 600, 'g'), i('Mrkva', 2, 'kom'), i('Korijen peršuna', 1, 'kom'), i('Celer', 1, 'kom'),
    i('Luk', 1, 'kom'), i('Rezanci za supu', 200, 'g'), ...z('So', 'Biber'),
  ], { days: 2 }),
  m('teleca-corba', 'Teleća čorba', 'corba', [
    i('Teletina', 500, 'g'), i('Mrkva', 2, 'kom'), i('Krompir', 0.4, 'kg'), i('Luk', 1, 'kom'), i('Celer', 1, 'kom'),
    i('Kiselo vrhnje', 1, 'kom'), ...z('Brašno', 'Ulje', 'So', 'Biber', 'Vegeta'),
  ], { days: 2 }),
  m('corba-povrce', 'Čorba od povrća', 'corba', [
    i('Krompir', 0.5, 'kg'), i('Mrkva', 2, 'kom'), i('Tikvice', 1, 'kom'), i('Luk', 1, 'kom'),
    i('Grašak (smrznuti)', 200, 'g'), ...z('Ulje', 'So', 'Vegeta'),
  ], { days: 2, forBaby: true }),
  m('paradajz-corba', 'Paradajz čorba', 'corba', [
    i('Pasirani paradajz', 2, 'kom'), i('Luk', 1, 'kom'), i('Riža', 50, 'g'), i('Kiselo vrhnje', 1, 'kom'),
    ...z('Ulje', 'Brašno', 'Šećer', 'So', 'Biber'),
  ], { days: 2 }),

  // Kuhana jela
  m('grah', 'Grah sa suhim mesom', 'kuhano', [
    i('Grah', 500, 'g'), i('Suho meso', 400, 'g'), i('Luk', 2, 'kom'), i('Mrkva', 1, 'kom'), i('Bijeli luk', 1, 'glavica'),
    ...z('Aleva paprika', 'Lovor', 'Ulje', 'Brašno', 'So', 'Biber'),
  ], { days: 2, notes: 'Grah potopiti u vodu noć prije.' }),
  m('grah-posni', 'Posni grah', 'kuhano', [
    i('Grah', 500, 'g'), i('Luk', 2, 'kom'), i('Mrkva', 1, 'kom'), i('Paprika', 1, 'kom'), i('Bijeli luk', 1, 'glavica'),
    ...z('Aleva paprika', 'Lovor', 'Ulje', 'So', 'Biber'),
  ], { days: 2, notes: 'Grah potopiti u vodu noć prije.' }),
  m('socivo', 'Sočivo', 'kuhano', [
    i('Sočivo', 400, 'g'), i('Luk', 1, 'kom'), i('Mrkva', 2, 'kom'), i('Krompir', 0.4, 'kg'), i('Bijeli luk', 1, 'glavica'),
    ...z('Aleva paprika', 'Lovor', 'Ulje', 'So'),
  ], { days: 2 }),
  m('kiseli-kupus', 'Kiseli kupus sa suhim mesom', 'kuhano', [
    i('Kiseli kupus', 1, 'glavica'), i('Suho meso', 400, 'g'), i('Luk', 1, 'kom'), i('Riža', 50, 'g'),
    ...z('Aleva paprika', 'Ulje', 'Biber'),
  ], { days: 2 }),
  m('sarma', 'Sarma', 'kuhano', [
    i('Kiseli kupus', 1, 'glavica'), i('Mljeveno meso', 800, 'g'), i('Riža', 150, 'g'), i('Luk', 2, 'kom'),
    i('Suho meso', 200, 'g'), ...z('Aleva paprika', 'Ulje', 'So', 'Biber', 'Vegeta'),
  ], { days: 3 }),
  m('japrak', 'Japrak', 'kuhano', [
    i('Listovi vinove loze', 1, 'paket'), i('Mljeveno meso', 500, 'g'), i('Riža', 100, 'g'), i('Luk', 1, 'kom'),
    i('Kiselo vrhnje', 1, 'kom'), ...z('Ulje', 'So', 'Biber', 'Aleva paprika'),
  ], { days: 2 }),
  m('punjene-paprike', 'Punjene paprike', 'kuhano', [
    i('Paprika', 10, 'kom'), i('Mljeveno meso', 700, 'g'), i('Riža', 150, 'g'), i('Luk', 1, 'kom'),
    i('Pasirani paradajz', 1, 'kom'), i('Jaja', 1, 'kom'), ...z('Ulje', 'Brašno', 'So', 'Biber', 'Aleva paprika', 'Vegeta'),
  ], { days: 2 }),
  m('sogan-dolma', 'Sogan dolma', 'kuhano', [
    i('Luk', 10, 'kom'), i('Mljeveno meso', 500, 'g'), i('Riža', 100, 'g'), i('Kiselo vrhnje', 1, 'kom'),
    i('Paradajz pire', 1, 'kom'), ...z('Ulje', 'So', 'Biber', 'Aleva paprika'),
  ], { days: 2 }),
  m('bosanski-lonac', 'Bosanski lonac', 'kuhano', [
    i('Junetina', 600, 'g'), i('Krompir', 0.8, 'kg'), i('Mrkva', 2, 'kom'), i('Kupus', 1, 'glavica'), i('Paprika', 2, 'kom'),
    i('Paradajz', 2, 'kom'), i('Luk', 2, 'kom'), i('Bijeli luk', 1, 'glavica'), i('Peršun', 1, 'vezica'),
    ...z('So', 'Biber', 'Lovor'),
  ], { days: 2 }),
  m('djuvec', 'Đuveč', 'kuhano', [
    i('Riža', 200, 'g'), i('Paprika', 3, 'kom'), i('Paradajz', 3, 'kom'), i('Tikvice', 1, 'kom'), i('Patlidžan', 1, 'kom'),
    i('Luk', 2, 'kom'), i('Mrkva', 1, 'kom'), ...z('Ulje', 'So', 'Vegeta', 'Aleva paprika'),
  ], { days: 2 }),
  m('gulas', 'Gulaš', 'kuhano', [
    i('Junetina', 800, 'g'), i('Luk', 3, 'kom'), i('Mrkva', 2, 'kom'), i('Paprika', 2, 'kom'), i('Bijeli luk', 1, 'glavica'),
    i('Paradajz pire', 1, 'kom'), ...z('Aleva paprika', 'Lovor', 'Brašno', 'Ulje', 'So', 'Biber'),
  ], { days: 2 }),
  m('cufte', 'Ćufte u sosu s pireom', 'kuhano', [
    i('Mljeveno meso', 600, 'g'), i('Jaja', 1, 'kom'), i('Prezle', 50, 'g'), i('Luk', 1, 'kom'), i('Bijeli luk', 1, 'glavica'),
    i('Pasirani paradajz', 1, 'kom'), i('Krompir', 1, 'kg'), i('Mlijeko', 0.2, 'l'), i('Maslac', 50, 'g'),
    ...z('Ulje', 'Brašno', 'So', 'Biber'),
  ]),
  m('mahune', 'Mahune s mesom', 'kuhano', [
    i('Mahune', 800, 'g'), i('Junetina', 400, 'g'), i('Krompir', 0.5, 'kg'), i('Luk', 1, 'kom'), i('Mrkva', 1, 'kom'),
    i('Bijeli luk', 1, 'glavica'), ...z('Aleva paprika', 'Brašno', 'Ulje', 'So'),
  ], { days: 2 }),
  m('grasak', 'Grašak s mesom', 'kuhano', [
    i('Grašak (smrznuti)', 800, 'g'), i('Junetina', 400, 'g'), i('Mrkva', 2, 'kom'), i('Krompir', 0.4, 'kg'),
    i('Luk', 1, 'kom'), i('Peršun', 1, 'vezica'), ...z('Ulje', 'Brašno', 'So'),
  ], { days: 2 }),
  m('krompir-paprikas', 'Krompir paprikaš s hrenovkama', 'kuhano', [
    i('Krompir', 1.5, 'kg'), i('Hrenovke', 4, 'kom'), i('Luk', 2, 'kom'), i('Mrkva', 1, 'kom'), i('Paprika', 1, 'kom'),
    ...z('Aleva paprika', 'Lovor', 'Ulje', 'So'),
  ], { days: 2 }),
  m('spinat', 'Špinat s jajima', 'kuhano', [
    i('Špinat (smrznuti)', 600, 'g'), i('Jaja', 4, 'kom'), i('Bijeli luk', 1, 'glavica'), i('Mlijeko', 0.2, 'l'),
    ...z('Brašno', 'Ulje', 'So'),
  ]),
  m('pileci-pilav', 'Pileći pilav', 'kuhano', [
    i('Riža', 300, 'g'), i('Pileći file', 500, 'g'), i('Luk', 1, 'kom'), i('Mrkva', 1, 'kom'),
    i('Grašak (smrznuti)', 200, 'g'), ...z('Ulje', 'So', 'Vegeta'),
  ]),

  // Pečeno
  m('musaka', 'Musaka od krompira', 'peceno', [
    i('Krompir', 1.5, 'kg'), i('Mljeveno meso', 600, 'g'), i('Luk', 2, 'kom'), i('Jaja', 2, 'kom'),
    i('Mlijeko', 0.3, 'l'), i('Kiselo vrhnje', 1, 'kom'), ...z('Ulje', 'So', 'Biber', 'Aleva paprika'),
  ], { days: 2 }),
  m('musaka-tikvice', 'Musaka od tikvica', 'peceno', [
    i('Tikvice', 4, 'kom'), i('Mljeveno meso', 500, 'g'), i('Luk', 1, 'kom'), i('Jaja', 2, 'kom'),
    i('Mlijeko', 0.3, 'l'), i('Kiselo vrhnje', 1, 'kom'), ...z('Ulje', 'So', 'Biber'),
  ], { days: 2 }),
  m('pecena-piletina', 'Pečena piletina s krompirom', 'peceno', [
    i('Pileći batak i karabatak', 1, 'kg'), i('Krompir', 1, 'kg'), i('Bijeli luk', 1, 'glavica'),
    ...z('Ulje', 'So', 'Biber', 'Aleva paprika'),
  ]),
  m('pohovana-piletina', 'Pohovana piletina', 'peceno', [
    i('Pileći file', 600, 'g'), i('Jaja', 2, 'kom'), i('Prezle', 150, 'g'), ...z('Brašno', 'Ulje', 'So'),
  ]),
  m('cevapi', 'Ćevapi', 'peceno', [
    i('Ćevapi', 20, 'kom'), i('Lepinje', 2, 'kom'), i('Luk', 1, 'kom'), i('Kajmak', 200, 'g'),
  ], { notes: '10 ćevapa po osobi.' }),
  m('pljeskavice', 'Pljeskavice', 'peceno', [
    i('Pljeskavice', 2, 'kom'), i('Lepinje', 2, 'kom'), i('Luk', 1, 'kom'), i('Kajmak', 200, 'g'),
  ]),
  m('pastrmka', 'Pečena pastrmka s krompirom', 'peceno', [
    i('Pastrmka', 2, 'kom'), i('Krompir', 0.8, 'kg'), i('Bijeli luk', 1, 'glavica'), i('Limun', 1, 'kom'),
    i('Peršun', 1, 'vezica'), ...z('Ulje', 'So'),
  ]),
  m('klepe', 'Klepe', 'kuhano', [
    i('Brašno', 0.5, 'kg'), i('Mljeveno meso', 400, 'g'), i('Luk', 1, 'kom'), i('Jogurt', 0.5, 'l'),
    i('Bijeli luk', 1, 'glavica'), i('Maslac', 50, 'g'), ...z('Aleva paprika', 'So', 'Biber'),
  ]),

  // Pite
  m('burek', 'Burek', 'pita', [
    i('Jufke', 1, 'paket'), i('Mljeveno meso', 600, 'g'), i('Luk', 2, 'kom'), ...z('Ulje', 'So', 'Biber'),
  ], { days: 2 }),
  m('krompirusa', 'Krompiruša', 'pita', [
    i('Jufke', 1, 'paket'), i('Krompir', 1, 'kg'), i('Luk', 1, 'kom'), ...z('Ulje', 'So', 'Biber'),
  ], { days: 2 }),
  m('zeljanica', 'Zeljanica', 'pita', [
    i('Jufke', 1, 'paket'), i('Špinat', 500, 'g'), i('Sir', 300, 'g'), i('Jaja', 2, 'kom'), i('Kiselo vrhnje', 1, 'kom'),
    ...z('Ulje', 'So'),
  ], { days: 2 }),
  m('sirnica', 'Sirnica', 'pita', [
    i('Jufke', 1, 'paket'), i('Sir', 500, 'g'), i('Jaja', 3, 'kom'), i('Kiselo vrhnje', 1, 'kom'), ...z('Ulje', 'So'),
  ], { days: 2 }),
  m('tikvenica', 'Tikvenica', 'pita', [
    i('Jufke', 1, 'paket'), i('Tikvice', 4, 'kom'), i('Jaja', 2, 'kom'), i('Kiselo vrhnje', 1, 'kom'), ...z('Ulje', 'So'),
  ], { days: 2 }),
  m('kupusnjaca', 'Kupusnjača', 'pita', [
    i('Jufke', 1, 'paket'), i('Kupus', 1, 'glavica'), i('Luk', 1, 'kom'), ...z('Ulje', 'So', 'Biber'),
  ], { days: 2 }),

  // Svakodnevno
  m('piletina-riza', 'Piletina s rižom', 'svakodnevno', [
    i('Pileći file', 500, 'g'), i('Riža', 250, 'g'), i('Mrkva', 1, 'kom'), ...z('Ulje', 'So', 'Vegeta'),
  ]),
  m('bolonjez', 'Špageti bolonjez', 'svakodnevno', [
    i('Špageti', 500, 'g'), i('Mljeveno meso', 400, 'g'), i('Pasirani paradajz', 1, 'kom'), i('Luk', 1, 'kom'),
    i('Bijeli luk', 1, 'glavica'), i('Kačkavalj', 100, 'g'), ...z('Ulje', 'So', 'Origano'),
  ]),
  m('tjestenina-piletina', 'Tjestenina s piletinom', 'svakodnevno', [
    i('Tjestenina', 500, 'g'), i('Pileći file', 400, 'g'), i('Vrhnje za kuhanje', 200, 'ml'), i('Šampinjoni', 250, 'g'),
    ...z('Ulje', 'So', 'Biber'),
  ]),
  m('pica', 'Domaća pica', 'svakodnevno', [
    i('Brašno', 0.5, 'kg'), i('Kvasac', 1, 'paket'), i('Šunka', 200, 'g'), i('Kačkavalj', 300, 'g'),
    i('Pasirani paradajz', 1, 'kom'), i('Šampinjoni', 200, 'g'), ...z('Ulje', 'So', 'Origano'),
  ]),
  m('hrenovke-pire', 'Hrenovke s pireom', 'svakodnevno', [
    i('Hrenovke', 6, 'kom'), i('Krompir', 1, 'kg'), i('Mlijeko', 0.2, 'l'), i('Maslac', 50, 'g'), ...z('So'),
  ]),
  m('pomfrit-snicle', 'Pomfrit i pileće šnicle', 'svakodnevno', [
    i('Pomfrit', 750, 'g'), i('Pileći file', 500, 'g'), ...z('Ulje', 'So', 'Biber'),
  ]),

  // Doručak (kuhani)
  m('kajgana', 'Kajgana', 'dorucak', [i('Jaja', 6, 'kom'), ...z('Ulje', 'So')]),
  m('ustipci', 'Uštipci', 'dorucak', [
    i('Brašno', 0.5, 'kg'), i('Jaja', 2, 'kom'), i('Jogurt', 0.5, 'l'), i('Kvasac', 1, 'paket'), ...z('Ulje', 'So'),
  ]),
  m('palacinke', 'Palačinke', 'dorucak', [
    i('Brašno', 0.3, 'kg'), i('Jaja', 3, 'kom'), i('Mlijeko', 0.5, 'l'), i('Mineralna voda', 0.2, 'l'),
    i('Eurokrem', 1, 'kom'), ...z('Ulje', 'Šećer'),
  ]),

  // Salate
  m('sopska', 'Šopska salata', 'salata', [
    i('Paradajz', 3, 'kom'), i('Krastavac', 2, 'kom'), i('Paprika', 1, 'kom'), i('Luk', 1, 'kom'), i('Feta sir', 200, 'g'),
    ...z('Ulje', 'So'),
  ]),
  m('sezonska', 'Sezonska salata', 'salata', [
    i('Paradajz', 2, 'kom'), i('Krastavac', 1, 'kom'), i('Paprika', 1, 'kom'), i('Luk', 1, 'kom'),
    ...z('Ulje', 'Sirće', 'So'),
  ]),
  m('zelena', 'Zelena salata', 'salata', [i('Zelena salata', 1, 'glavica'), ...z('Ulje', 'Sirće', 'So')]),
  m('kupus-salata', 'Kupus salata', 'salata', [i('Kupus', 0.5, 'glavica'), ...z('Ulje', 'Sirće', 'So')]),
  m('krompir-salata', 'Krompir salata', 'salata', [
    i('Krompir', 1, 'kg'), i('Luk', 1, 'kom'), ...z('Ulje', 'Sirće', 'So'),
  ]),

  // Slatko
  m('tufahije', 'Tufahije', 'slatko', [
    i('Jabuke', 8, 'kom'), i('Šećer', 0.4, 'kg'), i('Orasi', 150, 'g'), i('Slatko vrhnje', 200, 'ml'), i('Limun', 1, 'kom'),
  ]),
  m('hurmasice', 'Hurmašice', 'slatko', [
    i('Brašno', 0.5, 'kg'), i('Margarin', 250, 'g'), i('Jaja', 2, 'kom'), i('Šećer', 0.8, 'kg'),
    i('Prašak za pecivo', 1, 'paket'), i('Limun', 1, 'kom'), i('Orasi', 100, 'g'),
  ]),
  m('baklava', 'Baklava', 'slatko', [
    i('Jufke za baklavu', 1, 'paket'), i('Orasi', 500, 'g'), i('Maslac', 250, 'g'), i('Šećer', 1, 'kg'), i('Limun', 1, 'kom'),
  ]),
  m('sutlijas', 'Sutlijaš', 'slatko', [
    i('Riža', 150, 'g'), i('Mlijeko', 1.5, 'l'), i('Šećer', 0.2, 'kg'), i('Vanilin šećer', 2, 'paket'), ...z('Cimet'),
  ]),

  // Beba
  m('kasica-povrce', 'Kašica od povrća', 'beba', [
    i('Krompir', 0.2, 'kg'), i('Mrkva', 2, 'kom'), i('Tikvice', 1, 'kom'), ...z('Maslinovo ulje'),
  ], { forBaby: true }),
  m('kasica-voce', 'Voćna kašica', 'beba', [
    i('Jabuke', 2, 'kom'), i('Banane', 2, 'kom'), i('Kruške', 1, 'kom'),
  ], { forBaby: true }),
  m('zobena-kasa', 'Zobena kaša', 'beba', [i('Zobene pahuljice', 100, 'g'), i('Banane', 1, 'kom')], { forBaby: true }),
  m('piletina-povrce-beba', 'Piletina s povrćem (beba)', 'beba', [
    i('Pileći file', 200, 'g'), i('Krompir', 0.2, 'kg'), i('Mrkva', 1, 'kom'),
  ], { forBaby: true }),
];
