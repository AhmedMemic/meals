import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { savePrices } from '../../db/actions';
import { db } from '../../db/db';
import { STORE_LIST, storeName } from '../../data/stores';
import { shortDate, today } from '../../lib/dates';
import { activeDeals, dealsByKey, formatKm, latestPrices, parsePrice } from '../../lib/prices';
import type { Category, ListItem, StoreId } from '../../types';
import { formatQtyList, parseQtyText } from '../../lib/units';
import { s } from '../../strings';
import { Sheet } from '../Sheet';
import css from '../Form.module.css';
import priceCss from '../prices/Prices.module.css';

interface Props {
  item: ListItem;
  categories: Category[];
  onSave: (changes: Pick<ListItem, 'name' | 'category' | 'qty'>) => void;
  onHave: () => void;
  onClose: () => void;
}

export function ItemSheet({ item, categories, onSave, onHave, onClose }: Props) {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(formatQtyList(item.qty));
  const [category, setCategory] = useState(item.category);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, qty: parseQtyText(qty) });
  }

  return (
    <Sheet title={s.list.editItem} onClose={onClose}>
      <form className={css.form} onSubmit={submit}>
        <label className={css.field}>
          <span className={css.label}>{s.list.name}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className={css.field}>
          <span className={css.label}>{s.list.amount}</span>
          <input className="input" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={s.list.amountHint} />
        </label>
        <label className={css.field}>
          <span className={css.label}>{s.list.category}</span>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value as Category['id'])}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {item.sources.length > 0 && (
          <p className="muted">
            {s.list.from}: {item.sources.join(', ')}
          </p>
        )}
        <ItemPrices itemKey={item.key} name={item.name} />
        <div className={css.actions}>
          <button type="button" className="btn" onClick={onHave}>
            {s.list.haveAtHome}
          </button>
          <button type="submit" className="btn btn-primary">
            {s.common.save}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

/** Last price per store, the current sale and a small form to note a price. */
function ItemPrices({ itemKey, name }: { itemKey: string; name: string }) {
  const records = useLiveQuery(() => db.prices.where('key').equals(itemKey).toArray(), [itemKey]);
  const deals = useLiveQuery(() => db.deals.where('key').equals(itemKey).toArray(), [itemKey]);
  const [store, setStore] = useState<StoreId>('bingo');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');

  if (!records || !deals) return null;
  const latest = latestPrices(records);
  const sale = dealsByKey(activeDeals(deals, today())).get(itemKey);
  const amount = parsePrice(price);

  async function add() {
    if (amount === null) return;
    await savePrices([{ key: itemKey, name, store, price: amount, unit: unit.trim() || 'kom', date: today(), source: 'rucno' }]);
    setPrice('');
  }

  return (
    <div className={css.field}>
      <span className={css.label}>{s.prices.title}</span>
      {sale && <p className={priceCss.sale}>{s.prices.saleAt(storeName(sale.store), `${formatKm(sale.price)} / ${sale.unit}`)}</p>}
      {latest.length ? (
        <ul className={priceCss.prices}>
          {latest.map((r, i) => (
            <li key={r.id} className={priceCss.priceRow}>
              <span className={priceCss.priceStore}>
                {storeName(r.store)} <span className="muted">· {shortDate(r.date)}</span>
              </span>
              {i === 0 && latest.length > 1 && <span className={priceCss.cheapest}>{s.prices.cheapest}</span>}
              <span>
                {formatKm(r.price)} <span className="muted">/ {r.unit}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{s.prices.none}</p>
      )}
      <div className={priceCss.addPrice} aria-label={s.prices.addTitle} role="group">
        <select className="select" value={store} onChange={(e) => setStore(e.target.value as StoreId)} aria-label={s.receipt.store}>
          {STORE_LIST.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
        <input className="input" inputMode="decimal" placeholder="KM" aria-label={s.receipt.price} value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className="input" placeholder={s.prices.unitPlaceholder} aria-label={s.list.amount} value={unit} onChange={(e) => setUnit(e.target.value)} />
        <button type="button" className="btn" disabled={amount === null} onClick={add}>
          {s.prices.add}
        </button>
      </div>
    </div>
  );
}
