import type { CategoryId, QuickGroup, Unit } from '../types';

export interface StarterItem {
  name: string;
  category: CategoryId;
  unit?: Unit;
  staple?: boolean;
  groups?: QuickGroup[];
}

const S = true;
const D: QuickGroup[] = ['dorucak'];
const B: QuickGroup[] = ['beba'];

function c(category: CategoryId, items: [string, Unit?, boolean?, QuickGroup[]?][]): StarterItem[] {
  return items.map(([name, unit, staple, groups]) => ({ name, category, unit, staple, groups }));
}

export const STARTER_CATALOG: StarterItem[] = [
  ...c('povrce', [
    ['Krompir', 'kg'], ['Luk', 'kom'], ['Bijeli luk', 'glavica'], ['Mladi luk', 'vezica'], ['Mrkva', 'kom'],
    ['Paprika', 'kom'], ['Paradajz', 'kom'], ['Krastavac', 'kom'], ['Kupus', 'glavica'], ['Kiseli kupus', 'glavica'],
    ['Zelena salata', 'glavica'], ['Tikvice', 'kom'], ['Patlidžan', 'kom'], ['Špinat', 'g'], ['Blitva', 'vezica'],
    ['Peršun', 'vezica'], ['Korijen peršuna', 'kom'], ['Celer', 'kom'], ['Šampinjoni', 'g'], ['Mahune', 'g'],
  ]),
  ...c('voce', [
    ['Jabuke', 'kom'], ['Banane', 'kom'], ['Narandže', 'kg'], ['Mandarine', 'kg'], ['Limun', 'kom'],
    ['Kruške', 'kom'], ['Grožđe', 'kg'], ['Jagode', 'g'],
  ]),
  ...c('pekara', [
    ['Hljeb', 'kom', false, D], ['Lepinje', 'kom'], ['Kifle', 'kom', false, D], ['Tost hljeb', 'paket', false, D],
    ['Jufke', 'paket'], ['Jufke za baklavu', 'paket'],
  ]),
  ...c('mlijecni', [
    ['Mlijeko', 'l', false, D], ['Jogurt', 'l', false, D], ['Kiselo mlijeko', 'l'], ['Kiselo vrhnje', 'kom'],
    ['Slatko vrhnje', 'ml'], ['Vrhnje za kuhanje', 'ml'], ['Sir', 'g', false, D], ['Feta sir', 'g'],
    ['Kačkavalj', 'g', false, D], ['Kajmak', 'g', false, D], ['Maslac', 'g'], ['Margarin', 'g'],
    ['Jaja', 'kom', false, D], ['Sirni namaz', 'kom', false, D],
  ]),
  ...c('delikatese', [
    ['Salama', 'g', false, D], ['Sudžuka', 'g', false, D], ['Pašteta', 'kom', false, D], ['Hrenovke', 'kom', false, D],
    ['Šunka', 'g', false, D], ['Pileća prsa (narezak)', 'g', false, D], ['Suho meso', 'g'],
  ]),
  ...c('meso', [
    ['Mljeveno meso', 'g'], ['Pileći file', 'g'], ['Pileći batak i karabatak', 'kg'], ['Piletina za supu', 'g'],
    ['Junetina', 'g'], ['Teletina', 'g'], ['Govedina s kosti', 'g'], ['Ćevapi', 'kom'], ['Pljeskavice', 'kom'],
    ['Pastrmka', 'kom'],
  ]),
  ...c('smrznuto', [
    ['Grašak (smrznuti)', 'g'], ['Špinat (smrznuti)', 'g'], ['Miješano povrće', 'g'], ['Pomfrit', 'g'],
    ['Riba (smrznuta)', 'g'], ['Sladoled', 'kom'],
  ]),
  ...c('suhe', [
    ['Riža', 'g'], ['Tjestenina', 'g'], ['Špageti', 'g'], ['Rezanci za supu', 'g'], ['Brašno', 'kg', S],
    ['Šećer', 'kg', S], ['Grah', 'g'], ['Sočivo', 'g'], ['Zobene pahuljice', 'g', false, B], ['Prezle', 'g'],
    ['Kvasac', 'paket'], ['Prašak za pecivo', 'paket'], ['Vanilin šećer', 'paket'], ['Orasi', 'g'], ['Griz', 'g'],
    ['Corn flakes', 'paket', false, D],
  ]),
  ...c('konzerve', [
    ['Pasirani paradajz', 'kom'], ['Paradajz pire', 'kom'], ['Tuna', 'konzerva'], ['Kukuruz šećerac', 'konzerva'],
    ['Ajvar', 'kom', false, D], ['Džem', 'kom', false, D], ['Med', 'kom', false, D], ['Kisele krastavice', 'kom'],
    ['Listovi vinove loze', 'paket'],
  ]),
  ...c('zacini', [
    ['Ulje', 'l', S], ['Maslinovo ulje', 'l', S], ['So', 'kg', S], ['Biber', 'paket', S], ['Vegeta', 'paket', S],
    ['Aleva paprika', 'paket', S], ['Lovor', 'paket', S], ['Sirće', 'l', S], ['Origano', 'paket', S],
    ['Cimet', 'paket', S], ['Kečap', 'kom'], ['Majoneza', 'kom'], ['Senf', 'kom'],
  ]),
  ...c('slatko', [
    ['Čokolada', 'kom'], ['Keks', 'paket'], ['Eurokrem', 'kom', false, D], ['Čips', 'kom'], ['Napolitanke', 'paket'],
  ]),
  ...c('pice', [
    ['Voda', 'l'], ['Mineralna voda', 'l'], ['Sok', 'l'], ['Kafa', 'paket', false, D], ['Čaj', 'paket'],
  ]),
  ...c('beba', [
    ['Pelene', 'paket', false, B], ['Vlažne maramice', 'paket', false, B], ['Adaptirano mlijeko', 'kom', false, B],
    ['Dječija kašica', 'kom', false, B], ['Dječiji keks', 'paket', false, B], ['Krema za bebe', 'kom', false, B],
  ]),
  ...c('higijena', [
    ['Sapun', 'kom'], ['Toalet papir', 'paket'], ['Šampon', 'kom'], ['Pasta za zube', 'kom'],
    ['Četkica za zube', 'kom'], ['Papirni ubrusi', 'paket'], ['Papirne maramice', 'paket'], ['Dezodorans', 'kom'],
    ['Gel za tuširanje', 'kom'],
  ]),
  ...c('kucna', [
    ['Deterdžent za suđe', 'kom'], ['Deterdžent za veš', 'kom'], ['Omekšivač', 'kom'], ['Tablete za mašinu za suđe', 'paket'],
    ['Kese za smeće', 'paket'], ['Spužve', 'paket'], ['Sredstvo za čišćenje', 'kom'], ['Alu folija', 'kom'],
    ['Papir za pečenje', 'kom'], ['Prozirna folija', 'kom'],
  ]),
];
