import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { BackupReminder } from '../components/BackupReminder';
import { Icon } from '../components/Icon';
import { ItemSheet } from '../components/list/ItemSheet';
import { ListRow } from '../components/list/ListRow';
import { QuickAdd } from '../components/list/QuickAdd';
import { Page } from '../components/Page';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import formCss from '../components/Form.module.css';
import {
  clearChecked,
  clearList,
  needStaple,
  removeListItem,
  restoreListItem,
  setChecked,
  updateListItem,
} from '../db/actions';
import { db } from '../db/db';
import { groupByCategory, listToText } from '../lib/list';
import { getApiKey } from '../lib/aiKey';
import { today } from '../lib/dates';
import { activeDeals, dealsByKey } from '../lib/prices';
import { useReceiptScan } from '../components/prices/ReceiptScan';
import { formatQtyList } from '../lib/units';
import { s } from '../strings';
import type { ListItem } from '../types';
import css from './ListPage.module.css';

export function ListPage() {
  const items = useLiveQuery(() => db.list.toArray(), []);
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []);
  const catalog = useLiveQuery(() => db.catalog.toArray(), []);
  const deals = useLiveQuery(() => db.deals.toArray(), []);
  const receipt = useReceiptScan();
  const [editing, setEditing] = useState<ListItem | null>(null);
  const [menu, setMenu] = useState(false);
  const toast = useToast();

  const open = useMemo(() => (items ?? []).filter((i) => !i.checked && !i.staple), [items]);
  const staples = useMemo(() => (items ?? []).filter((i) => !i.checked && i.staple), [items]);
  const done = useMemo(
    () => (items ?? []).filter((i) => i.checked).sort((a, b) => a.name.localeCompare(b.name, 'bs')),
    [items],
  );
  const onList = useMemo(() => new Set([...open, ...staples].map((i) => i.key)), [open, staples]);
  const groups = useMemo(() => groupByCategory(open, categories ?? []), [open, categories]);
  const sales = useMemo(() => dealsByKey(activeDeals(deals ?? [], today())), [deals]);

  if (!items || !categories || !catalog) return null;

  /** "Imam kod kuće" or ✕: removes the item, with undo. */
  async function remove(item: ListItem) {
    await removeListItem(item.id!);
    setEditing(null);
    toast({ text: s.list.removed(item.name), action: { label: s.common.undo, run: () => restoreListItem(item) } });
  }

  async function haveAll() {
    const removed = staples;
    await Promise.all(removed.map((i) => removeListItem(i.id!)));
    toast({
      text: s.list.removed(removed.map((i) => i.name).join(', ')),
      action: { label: s.common.undo, run: () => void Promise.all(removed.map((i) => restoreListItem(i))) },
    });
  }

  async function share() {
    const text = listToText(items!.filter((i) => !i.staple), categories!, s.list.shareTitle);
    try {
      if (navigator.share) await navigator.share({ title: s.list.shareTitle, text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ text: s.list.copied });
      }
    } catch {
      // Share sheet closed.
    }
  }

  return (
    <Page
      title={s.list.title}
      subtitle={s.list.summary(open.length, done.length)}
      actions={
        <>
          <button type="button" className="icon-btn" aria-label={s.list.share} onClick={share} disabled={!open.length}>
            <Icon name="share" size={20} />
          </button>
          <button type="button" className="icon-btn" aria-label={s.common.more} onClick={() => setMenu(true)}>
            <Icon name="dots" size={20} />
          </button>
        </>
      }
    >
      <BackupReminder />
      <QuickAdd catalog={catalog} categories={categories} onList={onList} />

      {staples.length > 0 && (
        <section className={css.staples} aria-labelledby="staples-title">
          <h2 id="staples-title" className="section-title">
            {s.list.checkAtHome}
          </h2>
          <p className={css.hint}>{s.list.checkAtHomeHint}</p>
          <div className={css.stapleChips}>
            {staples.map((i) => (
              <button key={i.id} type="button" className="chip" onClick={() => needStaple(i.id!)}>
                + {i.name}
                {i.qty.some((q) => q.amount !== null) && <span className={css.stapleQty}>{formatQtyList(i.qty)}</span>}
              </button>
            ))}
          </div>
          <button type="button" className={`btn btn-ghost ${css.small}`} onClick={haveAll}>
            <Icon name="check" size={16} />
            {s.list.haveAll}
          </button>
        </section>
      )}

      {!open.length && !staples.length && !done.length && <p className={css.empty}>{s.list.empty}</p>}

      {groups.map((g) => (
        <section key={g.category.id} aria-label={g.category.name}>
          <h2 className="section-title">{g.category.name}</h2>
          <ul className={css.list}>
            {g.items.map((i) => (
              <ListRow
                key={i.id}
                item={i}
                deal={sales.get(i.key)}
                onToggle={() => setChecked(i.id!, true)}
                onOpen={() => setEditing(i)}
                onDelete={() => remove(i)}
              />
            ))}
          </ul>
        </section>
      ))}

      {done.length > 0 && (
        <section aria-label={s.list.bought}>
          <div className={css.doneHead}>
            <h2 className="section-title">{s.list.bought}</h2>
            <button type="button" className={`btn btn-ghost ${css.small}`} onClick={() => clearChecked()}>
              {s.list.clearBought}
            </button>
          </div>
          <ul className={css.list}>
            {done.map((i) => (
              <ListRow
                key={i.id}
                item={i}
                onToggle={() => setChecked(i.id!, false)}
                onOpen={() => setEditing(i)}
                onDelete={() => remove(i)}
              />
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <ItemSheet
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onHave={() => remove(editing)}
          onSave={async (changes) => {
            await updateListItem(editing.id!, changes);
            setEditing(null);
          }}
        />
      )}

      {menu && (
        <Sheet title={s.list.title} onClose={() => setMenu(false)}>
          <div className={formCss.menu}>
            <button
              type="button"
              className="btn"
              disabled={!getApiKey()}
              onClick={() => {
                setMenu(false);
                receipt.scan();
              }}
            >
              {s.deals.receipt}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!done.length}
              onClick={async () => {
                await clearChecked();
                setMenu(false);
              }}
            >
              {s.list.clearBought}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                if (!confirm(s.list.confirmClearAll)) return;
                await clearList();
                setMenu(false);
              }}
            >
              {s.list.clearAll}
            </button>
          </div>
        </Sheet>
      )}

      {receipt.element}
    </Page>
  );
}
