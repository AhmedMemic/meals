import { useState } from 'react';
import type { Category, ListItem } from '../../types';
import { formatQtyList, parseQtyText } from '../../lib/units';
import { s } from '../../strings';
import { Sheet } from '../Sheet';
import css from '../Form.module.css';

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
