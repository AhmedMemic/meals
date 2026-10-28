// Catalogs published as Issuu flipbooks (Bingo, Mercator): the store page embeds or links
// the flipbooks, each Issuu document page names its image id and page count, and every
// page is a public JPG at image.isu.pub/<id>/jpg/page_<n>.jpg.
// Works from Node (the weekly Action); in the browser the store and Issuu pages block cross-site reads.

/** Most pages sent to Claude from one catalog. */
export const MAX_ISSUU_PAGES = 40;

export interface IssuuSource {
  /** Page that embeds or links the store's Issuu catalogs. */
  page: string;
  /** The page lists catalogs per city: first pick the family's city in its city <select>. */
  cityPicker?: boolean;
  /** Which catalogs to read, by Issuu document name; default: the first one on the page. */
  docs?: RegExp;
}

export interface IssuuDoc {
  user: string;
  doc: string;
}

/** All Issuu documents embedded in or linked from a page, in page order. */
export function findIssuuDocs(html: string): IssuuDoc[] {
  const out = new Map<string, IssuuDoc>();
  const add = (user: string | null | undefined, doc: string | null | undefined) => {
    if (user && doc) out.set(`${user}/${doc}`, { user, doc });
  };
  const re = /issuu\.com\/embed\.html\?([^"'\s<>]+)|issuu\.com\/([\w.-]+)\/docs\/([\w.-]+)/g;
  for (const m of html.matchAll(re)) {
    if (m[1]) {
      const q = new URLSearchParams(m[1].replace(/&amp;/g, '&'));
      add(q.get('u'), q.get('d'));
    } else add(m[2], m[3]);
  }
  return [...out.values()];
}

const plain = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').trim().toLowerCase();

/** URL of the city's option in a city <select> (value = page URL), or null. */
export function cityOptionUrl(html: string, city: string, base: string): string | null {
  for (const m of html.matchAll(/<option[^>]*value="([^"]+)"[^>]*>([^<]+)/g)) {
    if (plain(m[2]!) === plain(city)) return new URL(m[1]!.replace(/&amp;/g, '&'), base).href;
  }
  return null;
}

/** Image URLs of all pages, read from the Issuu document page, or [] if not found. */
export function issuuPageImages(html: string): string[] {
  const id = html.match(/image\.isu\.pub\/([\w-]+)\/jpg\/page_1/)?.[1];
  const count = Number(html.match(/pageCount\\?"\s*:\s*(\d+)/)?.[1]);
  if (!id || !(count > 0)) return [];
  const n = Math.min(count, MAX_ISSUU_PAGES);
  return Array.from({ length: n }, (_, i) => `https://image.isu.pub/${id}/jpg/page_${i + 1}.jpg`);
}

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

/** Page images of the store's current catalogs for the city; throws if none are found. */
export async function fetchIssuuCatalogs(
  source: IssuuSource,
  city: string,
): Promise<{ doc: string; images: string[] }[]> {
  let html = await get(source.page);
  if (source.cityPicker) {
    const url = cityOptionUrl(html, city, source.page);
    if (!url) throw new Error(`${city} is not in the city list on ${source.page}`);
    html = await get(url);
  }
  const all = findIssuuDocs(html);
  const docs = source.docs ? all.filter((d) => source.docs!.test(d.doc)) : all.slice(0, 1);
  const found = await Promise.all(
    docs.map(async ({ user, doc }) => {
      const images = await get(`https://issuu.com/${user}/docs/${doc}`).then(issuuPageImages, () => []);
      return { doc, images };
    }),
  );
  const out = found.filter((f) => f.images.length);
  if (!out.length) throw new Error(`no Issuu catalog pages on ${source.page}`);
  return out;
}
