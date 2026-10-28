import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState, type ReactNode } from 'react';
import { savePrices } from '../../db/actions';
import { db } from '../../db/db';
import { STORE_LIST } from '../../data/stores';
import { AiError } from '../../lib/aiKey';
import { today } from '../../lib/dates';
import { parsePrice, type Receipt, type ReceiptLine } from '../../lib/prices';
import { normalizeKey } from '../../lib/units';
import { s } from '../../strings';
import type { StoreId } from '../../types';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';
import formCss from '../Form.module.css';
import css from './Prices.module.css';

interface Line extends ReceiptLine {
  include: boolean;
  priceText: string;
}

/** "Slikaj račun": camera → Claude reads the receipt → user checks → prices saved. */
export function useReceiptScan(): { scan: () => void; element: ReactNode } {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'reading' | Receipt>('idle');
  const catalog = useLiveQuery(() => db.catalog.toArray(), []);
  const toast = useToast();

  async function read(file: File) {
    setState('reading');
    try {
      const { readReceipt } = await import('../../lib/ai');
      setState(await readReceipt(file, catalog ?? [], today()));
    } catch (e) {
      setState('idle');
      toast({ text: s.ai.errors[e instanceof AiError ? e.kind : 'other'] });
    }
  }

  const element = (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void read(f);
        }}
      />
      {state === 'reading' && (
        <Sheet title={s.receipt.title} onClose={() => setState('idle')}>
          <p className={css.loading}>{s.receipt.reading}</p>
        </Sheet>
      )}
      {typeof state === 'object' && (
        <ReceiptSheet
          receipt={state}
          catalogNames={new Map((catalog ?? []).map((c) => [c.key, c.name]))}
          onClose={() => setState('idle')}
          onSaved={(n) => {
            setState('idle');
            toast({ text: s.receipt.saved(n) });
          }}
        />
      )}
    </>
  );

  return { scan: () => input.current?.click(), element };
}

interface SheetProps {
  receipt: Receipt;
  catalogNames: Map<string, string>;
  onClose: () => void;
  onSaved: (n: number) => void;
}

function ReceiptSheet({ receipt, catalogNames, onClose, onSaved }: SheetProps) {
  const [store, setStore] = useState<StoreId>(receipt.store);
  const [date, setDate] = useState(receipt.date ?? today());
  const [lines, setLines] = useState<Line[]>(() =>
    receipt.lines.map((l) => ({ ...l, include: true, priceText: l.price.toFixed(2).replace('.', ',') })),
  );

  const chosen = lines.filter((l) => l.include && parsePrice(l.priceText) !== null && l.name.trim());

  function update(i: number, changes: Partial<Line>) {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...changes } : l)));
  }

  async function save() {
    await savePrices(
      chosen.map((l) => ({
        key: l.key ?? normalizeKey(l.name),
        name: l.name.trim(),
        store,
        price: parsePrice(l.priceText)!,
        unit: l.unit,
        date,
        source: 'racun' as const,
      })),
    );
    onSaved(chosen.length);
  }

  return (
    <Sheet title={s.receipt.title} onClose={onClose}>
      <div className={formCss.form}>
        <div className={css.twoCols}>
          <label className={formCss.field}>
            <span className={formCss.label}>{s.receipt.store}</span>
            <select className="select" value={store} onChange={(e) => setStore(e.target.value as StoreId)}>
              {STORE_LIST.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </label>
          <label className={formCss.field}>
            <span className={formCss.label}>{s.receipt.date}</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {lines.length ? <p className="muted">{s.receipt.hint}</p> : <p className="muted">{s.receipt.empty}</p>}

        <ul className={css.lines}>
          {lines.map((l, i) => (
            <li key={i} className={`${css.line} ${l.include ? '' : css.off}`}>
              <input
                type="checkbox"
                className={css.lineCheck}
                checked={l.include}
                aria-label={s.receipt.include(l.name)}
                onChange={(e) => update(i, { include: e.target.checked })}
              />
              <div className={css.lineBody}>
                <input
                  className={`input ${css.lineName}`}
                  aria-label={s.receipt.name}
                  value={l.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
                <div className={css.lineMeta}>
                  <input
                    className={`input ${css.linePrice}`}
                    aria-label={s.receipt.price}
                    inputMode="decimal"
                    value={l.priceText}
                    onChange={(e) => update(i, { priceText: e.target.value })}
                  />
                  <span className="muted">
                    KM {s.receipt.per} {l.unit}
                  </span>
                  {l.key && <span className={css.known}>{s.receipt.known(catalogNames.get(l.key) ?? l.key)}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className={formCss.actions}>
          <button type="button" className="btn" onClick={onClose}>
            {s.common.cancel}
          </button>
          <button type="button" className="btn btn-primary" disabled={!chosen.length} onClick={save}>
            {s.receipt.save(chosen.length)}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
