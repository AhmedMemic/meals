// Claude calls, made straight from the phone with the user's own API key.
// Loaded on demand (the SDK is large); key and errors live in aiKey.ts.
import Anthropic from '@anthropic-ai/sdk';
import { STORES, type CatalogItem, type Deal } from '../types';
import type { Store } from '../data/stores';
import { cleanDeals, cleanReceipt, type RawDeal, type RawReceipt, type Receipt } from './prices';
import { AiError, getApiKey } from './aiKey';

const MODEL = 'claude-opus-5-5';
function client(): Anthropic {
  const apiKey = getApiKey();
  if (!apiKey) throw new AiError('noKey');
  // The key is the user's own and stays on their phone.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
    return new AiError('badKey', e.message);
  if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError)
    return new AiError('busy', e.message);
  if (e instanceof Anthropic.APIConnectionError) return new AiError('network', e.message);
  if (e instanceof Anthropic.APIError) return new AiError('other', e.message);
  return new AiError('other', e instanceof Error ? e.message : String(e));
}

type Tool = Anthropic.Beta.BetaToolUnion;

/**
 * One request, continued while server tools (web fetch/search) pause the turn.
 * Returns the text of the final answer.
 */
async function run(
  content: Anthropic.Beta.BetaContentBlockParam[],
  opts: { tools?: Tool[]; schema?: Record<string, unknown> } = {},
): Promise<string> {
  const c = client();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content }];
  try {
    for (let turn = 0; turn < 6; turn++) {
      const res = await c.beta.messages
        .stream({
          model: MODEL,
          max_tokens: 64000,
          betas: ['server-side-fallback-2026-07-01'],
          // On a safety decline, the API retries on a suitable fallback model.
          fallbacks: 'default',
          output_config: { effort: 'medium', ...(opts.schema && { format: { type: 'json_schema', schema: opts.schema } }) },
          tools: opts.tools,
          messages,
        })
        .finalMessage();
      if (res.stop_reason === 'refusal') throw new AiError('refused');
      if (res.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: res.content });
        continue;
      }
      const texts = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text');
      return texts.map((b) => b.text).join('');
    }
    throw new AiError('other', 'too many turns');
  } catch (e) {
    throw toAiError(e);
  }
}

/** Parses JSON, also when it is wrapped in a sentence or a ``` block. */
export function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        // fall through
      }
    }
    throw new AiError('unreadable', text.slice(0, 200));
  }
}

const nullable = (type: string) => ({ type: [type, 'null'] });

const DEAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'price', 'oldPrice', 'unit', 'validFrom', 'validTo', 'key'],
  properties: {
    name: { type: 'string' },
    price: { type: 'number' },
    oldPrice: nullable('number'),
    unit: { type: 'string' },
    validFrom: nullable('string'),
    validTo: nullable('string'),
    key: nullable('string'),
  },
};

const DEALS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['deals'],
  properties: { deals: { type: 'array', items: DEAL_SCHEMA } },
};

const RECEIPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['store', 'date', 'items'],
  properties: {
    store: { type: 'string', enum: [...STORES] },
    date: nullable('string'),
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'price', 'unit', 'key'],
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          unit: { type: 'string' },
          key: nullable('string'),
        },
      },
    },
  },
};

function catalogText(catalog: CatalogItem[]): string {
  return catalog.map((c) => c.key).join('\n');
}

const KEY_RULE =
  'For "key", pick the matching entry from the list of known items below when it is clearly the same kind of product ' +
  '(e.g. "Mlijeko Meggle 2,8% 1 l" → "mlijeko", "Pileća prsa file kg" → "piletina"); otherwise null. ' +
  'Copy the key exactly as written in the list.';

const DEAL_RULES = `For each offer give:
- name: product name as the store writes it (brand, size included)
- price: the current/sale price in KM (number, e.g. 1.85)
- oldPrice: the regular price in KM if shown, else null
- unit: what the price is for, short: "kg", "kom", "1 l", "500 g", "pak" …
- validFrom / validTo: dates of the offer as YYYY-MM-DD if stated (use the current year when no year is given), else null
- key: ${KEY_RULE}
Only food, drinks, baby products, hygiene and household cleaning items. Skip tools, furniture, clothes, electronics.`;

/** Step 1 asks Claude to browse; offers shown only as pictures come back as image URLs. */
interface BrowseResult {
  deals?: RawDeal[];
  images?: unknown[];
}

/** Reads a store's current sales. */
export async function fetchDeals(store: Store, catalog: CatalogItem[], today: string): Promise<Deal[]> {
  const pages = store.salePages.length ? store.salePages.join('\n') : '(none, search the web)';
  const prompt = `You check current grocery sales (akcije, vikend akcija, katalog) for a family in Bosnia and Herzegovina.
Today is ${today}. Store: ${store.name} (Bosnia and Herzegovina).
Start with these pages:
${pages}
${store.hint ?? ''}
Use web_fetch on them and follow links to the current sale or catalog pages if needed. Use web_search only if the pages do not work.
Collect every product that is on sale now or later this week. Ignore offers that already ended.

${DEAL_RULES}

If some current offers are published only as images (flyer or catalog pages), also list up to 8 direct image URLs (.jpg, .png, .webp) of those current pages in "images".

Answer with only this JSON, nothing else:
{"deals": [{"name": "", "price": 0, "oldPrice": null, "unit": "", "validFrom": null, "validTo": null, "key": null}], "images": []}

Known items:
${catalogText(catalog)}`;

  const text = await run([{ type: 'text', text: prompt }], {
    tools: [
      { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 8 },
      { type: 'web_search_20260209', name: 'web_search', max_uses: 3 },
    ],
  });
  const browsed = parseJson<BrowseResult>(text);
  const raw = [...(browsed.deals ?? [])];

  const images = (browsed.images ?? [])
    .filter((u): u is string => typeof u === 'string' && /^https:\/\/\S+$/.test(u))
    .slice(0, 8);
  if (images.length) {
    try {
      const fromImages = await run(
        [
          ...images.map((url): Anthropic.Beta.BetaImageBlockParam => ({ type: 'image', source: { type: 'url', url } })),
          {
            type: 'text',
            text: `These are current sale flyer pages from ${store.name} (Bosnia and Herzegovina). Today is ${today}. List the offers on them.\n\n${DEAL_RULES}\n\nKnown items:\n${catalogText(catalog)}`,
          },
        ],
        { schema: DEALS_SCHEMA },
      );
      raw.push(...(parseJson<{ deals?: RawDeal[] }>(fromImages).deals ?? []));
    } catch {
      // Images could not be read: keep what the pages gave.
    }
  }

  const byKey = new Map(catalog.map((c) => [c.key, c]));
  return cleanDeals(raw, store.id, byKey, Date.now());
}

/** Reads items and prices from a photo of a receipt. */
export async function readReceipt(photo: Blob, catalog: CatalogItem[], today: string): Promise<Receipt> {
  const { data, mediaType } = await toJpeg(photo);
  const prompt = `This is a shopping receipt from Bosnia and Herzegovina. Today is ${today}.
Read:
- store: one of ${STORES.join(', ')} (Bingo, Mercator, Konzum, Penny; "pijaca" for a market; "ostalo" if unknown)
- date: the purchase date as YYYY-MM-DD, or null if you cannot read it
- items: every bought product (skip totals, discounts lines, deposits/povratna naknada, bags only if they are not products):
  - name: the product as printed, readable (expand obvious abbreviations)
  - price: the price per unit in KM (for weighed goods the price per kg; otherwise the price of one piece)
  - unit: "kg" for weighed goods, otherwise the package, e.g. "1 l", "500 g", "kom"
  - key: ${KEY_RULE}

Known items:
${catalogText(catalog)}`;
  const text = await run(
    [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
      { type: 'text', text: prompt },
    ],
    { schema: RECEIPT_SCHEMA },
  );
  const byKey = new Map(catalog.map((c) => [c.key, c]));
  return cleanReceipt(parseJson<RawReceipt>(text), byKey);
}

/** Shrinks a camera photo (often 4000+ px) to a JPEG Claude can read well. */
async function toJpeg(photo: Blob): Promise<{ data: string; mediaType: 'image/jpeg' }> {
  const bitmap = await createImageBitmap(photo);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL('image/jpeg', 0.85);
  return { data: url.slice(url.indexOf(',') + 1), mediaType: 'image/jpeg' };
}
