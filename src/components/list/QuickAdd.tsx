import { useMemo, useState } from 'react';
import type { CatalogItem, Category, QuickGroup } from '../../types';
import { addItem, addListItem } from '../../db/actions';
import { getItem, setItem } from '../../lib/storage';
import { normalizeKey, parseQuickInput, searchKey } from '../../lib/units';
import { s } from '../../strings';
import { Icon } from '../Icon';
import css from './QuickAdd.module.css';

type Tab = 'often' | QuickGroup;

const TABS: { id: Tab; label: string }[] = [
  { id: 'often', label: s.list.quickFrequent },
  { id: 'dorucak', label: s.list.quickBreakfast },
  { id: 'beba', label: s.list.quickBaby },
];

// Shown under "Često" until the app has learned what we buy.
const DEFAULT_OFTEN = ['hljeb', 'mlijeko', 'jaja', 'jogurt', 'sir', 'banane', 'jabuke', 'toalet papir', 'sapun'];

interface Props {
  catalog: CatalogItem[];
  categories: Category[];
  /** Keys of items already open on the list (hidden from chips). */
  onList: Set<string>;
}

export function QuickAdd({ catalog, categories, onList }: Props) {
  const [text, setText] = useState('');
  const [tab, setTab] = useState<Tab>(() => (getItem('quickTab') as Tab | null) ?? 'often');
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const parsed = parseQuickInput(text);
  const query = searchKey(parsed.name);
  const suggestions = query
    ? catalog
        .filter((c) => searchKey(c.name).includes(query) && c.key !== normalizeKey(parsed.name))
        .sort((a, b) => Number(searchKey(b.name).startsWith(query)) - Number(searchKey(a.name).startsWith(query)) || b.useCount - a.useCount)
        .slice(0, 5)
    : [];

  const chips = useMemo(() => {
    const free = catalog.filter((c) => !onList.has(c.key));
    if (tab !== 'often') return free.filter((c) => c.groups.includes(tab));
    const used = free.filter((c) => c.useCount > 0).sort((a, b) => b.useCount - a.useCount || b.lastUsed - a.lastUsed);
    const defaults = DEFAULT_OFTEN.map((k) => free.find((c) => c.key === k)).filter((c): c is CatalogItem => !!c);
    return [...new Map([...used, ...defaults].map((c) => [c.key, c])).values()].slice(0, 14);
  }, [catalog, onList, tab]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await addListItem(text);
    setText('');
  }

  async function pick(c: CatalogItem) {
    await addItem(c.name, parsed.qty);
    setText('');
  }

  function chooseTab(t: Tab) {
    setTab(t);
    setItem('quickTab', t);
  }

  return (
    <section>
      <form className={css.form} onSubmit={submit}>
        <div className={css.wrap}>
          <label htmlFor="quick-add" className="sr-only">
            {s.list.addLabel}
          </label>
          <input
            id="quick-add"
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={s.list.addPlaceholder}
            autoComplete="off"
            enterKeyHint="done"
          />
          {suggestions.length > 0 && (
            <ul className={css.suggestions}>
              {suggestions.map((c) => (
                <li key={c.key}>
                  <button type="button" className={css.suggestion} onClick={() => pick(c)}>
                    <span>{c.name}</span>
                    <span className={css.cat}>{catName.get(c.category)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className={css.add} aria-label={s.common.add}>
          <Icon name="plus" size={24} />
        </button>
      </form>
      <div className={css.tabs}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className={css.tab} aria-pressed={tab === t.id} onClick={() => chooseTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={css.chips}>
        {chips.map((c) => (
          <button key={c.key} type="button" className="chip" onClick={() => addItem(c.name, null)}>
            + {c.name}
          </button>
        ))}
      </div>
    </section>
  );
}
