import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Page } from '../components/Page';
import { DealRow } from '../components/prices/DealRow';
import { useReceiptScan } from '../components/prices/ReceiptScan';
import { useToast } from '../components/Toast';
import { addItem, replaceDeals } from '../db/actions';
import { db } from '../db/db';
import { SALE_STORES, storeName } from '../data/stores';
import { AiError, getApiKey, getCity } from '../lib/aiKey';
import { shortDate, today } from '../lib/dates';
import { activeDeals, groupDeals } from '../lib/prices';
import { getItem, setItem } from '../lib/storage';
import { normalizeKey } from '../lib/units';
import { s } from '../strings';
import type { Deal, StoreId } from '../types';
import css from './DealsPage.module.css';

type Filter = StoreId | 'all';

function lastChecked(store: StoreId): string | null {
  return getItem(`dealsChecked:${store}`);
}

export function DealsPage() {
  const deals = useLiveQuery(() => db.deals.toArray(), []);
  const list = useLiveQuery(() => db.list.toArray(), []);
  const catalog = useLiveQuery(() => db.catalog.toArray(), []);
  const meals = useLiveQuery(() => db.meals.toArray(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [running, setRunning] = useState<StoreId[]>([]);
  const [showOther, setShowOther] = useState(false);
  const receipt = useReceiptScan();
  const toast = useToast();
  const hasKey = !!getApiKey();

  const listKeys = useMemo(() => new Set((list ?? []).filter((i) => !i.checked).map((i) => i.key)), [list]);
  // "Things we buy": items we have added before and every meal ingredient.
  const usedKeys = useMemo(() => {
    const keys = new Set((catalog ?? []).filter((c) => c.useCount > 0).map((c) => c.key));
    for (const m of meals ?? []) if (!m.hidden) for (const i of m.ingredients) keys.add(normalizeKey(i.name));
    return keys;
  }, [catalog, meals]);

  const shown = useMemo(
    () => activeDeals(deals ?? [], today()).filter((d) => filter === 'all' || d.store === filter),
    [deals, filter],
  );
  const groups = useMemo(() => groupDeals(shown, listKeys, usedKeys), [shown, listKeys, usedKeys]);

  if (!deals || !list || !catalog || !meals) return null;

  async function check() {
    const stores = SALE_STORES.filter((st) => filter === 'all' || st.id === filter);
    setRunning(stores.map((st) => st.id));
    await Promise.all(
      stores.map(async (st) => {
        try {
          const { fetchDeals } = await import('../lib/ai');
          const found = await fetchDeals(st, catalog!, today(), getCity());
          await replaceDeals(st.id, found);
          setItem(`dealsChecked:${st.id}`, today());
          toast({ text: s.deals.checked(st.name, found.length) });
        } catch (e) {
          toast({
            text: e instanceof AiError && e.kind !== 'other' ? s.ai.errors[e.kind] : s.deals.failed(st.name),
          });
        } finally {
          setRunning((r) => r.filter((id) => id !== st.id));
        }
      }),
    );
  }

  async function add(d: Deal) {
    const name = (d.key && catalog!.find((c) => c.key === d.key)?.name) || d.name;
    await addItem(name, null);
    toast({ text: s.deals.added(name) });
  }

  const checkedDates = SALE_STORES.filter((st) => filter === 'all' || st.id === filter)
    .map((st) => [st.name, lastChecked(st.id)] as const)
    .filter(([, d]) => d);

  const section = (title: string, items: Deal[]) =>
    items.length > 0 && (
      <section aria-label={title}>
        <h2 className="section-title">{title}</h2>
        <ul className={css.list}>
          {items.map((d) => (
            <DealRow key={d.id} deal={d} showStore={filter === 'all'} onAdd={() => add(d)} />
          ))}
        </ul>
      </section>
    );

  return (
    <Page
      title={s.deals.title}
      subtitle={s.deals.subtitle(shown.length)}
      actions={
        <button type="button" className="icon-btn" aria-label={s.deals.receipt} onClick={receipt.scan} disabled={!hasKey}>
          <Icon name="camera" size={20} />
        </button>
      }
    >
      {!hasKey && (
        <p className={css.notice}>
          {s.deals.noKey}{' '}
          <Link to="/vise" className={css.link}>
            {s.deals.goToSettings}
          </Link>
        </p>
      )}

      <div className={css.chips} role="group">
        {(['all', ...SALE_STORES.map((st) => st.id)] as Filter[]).map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? s.deals.all : storeName(f)}
          </button>
        ))}
      </div>

      <button type="button" className={`btn btn-primary ${css.check}`} disabled={!hasKey || running.length > 0} onClick={check}>
        {running.length ? s.deals.checking(running.map(storeName).join(', ')) : s.deals.check}
      </button>
      <p className={css.meta}>
        {running.length
          ? s.deals.checkingHint
          : checkedDates.length
            ? checkedDates.map(([n, d]) => `${n} ${shortDate(d!)}`).join(' · ')
            : s.deals.neverChecked}
        <br />
        {s.deals.weekly(getCity())}
      </p>

      {!shown.length && <p className={css.empty}>{filter === 'all' ? s.deals.none : s.deals.noneStore}</p>}

      {section(s.deals.forList, groups.forList)}
      {section(s.deals.usual, groups.usual)}
      {section(s.deals.big, groups.big)}
      {groups.other.length > 0 &&
        (showOther ? (
          section(s.deals.other, groups.other)
        ) : (
          <button type="button" className={`btn btn-ghost ${css.more}`} onClick={() => setShowOther(true)}>
            {s.deals.showOther(groups.other.length)}
          </button>
        ))}

      {receipt.element}
    </Page>
  );
}
