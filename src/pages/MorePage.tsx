import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Page } from '../components/Page';
import { useToast } from '../components/Toast';
import { moveCategory, restoreStarterMeals } from '../db/actions';
import { db } from '../db/db';
import { createBackup, lastBackup, markBackedUp, parseBackup, restoreBackup, shareBackup } from '../lib/backup';
import { shortDate } from '../lib/dates';
import { s } from '../strings';
import css from './MorePage.module.css';

export function MorePage() {
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []);
  const weeks = useLiveQuery(() => db.weeks.toArray(), []);
  const [last, setLast] = useState(lastBackup);
  const fileInput = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function exportData() {
    const r = await shareBackup(await createBackup());
    if (r !== 'cancelled') toast({ text: s.more.exported });
    setLast(lastBackup());
  }

  async function importFile(file: File) {
    try {
      const backup = parseBackup(await file.text());
      if (!confirm(s.more.confirmImport)) return;
      await restoreBackup(backup);
      markBackedUp();
      setLast(lastBackup());
      toast({ text: s.more.imported });
    } catch {
      toast({ text: s.more.importError });
    }
  }

  return (
    <Page title={s.more.title}>
      <section className={css.section}>
        <h2 className="section-title">{s.more.backup}</h2>
        <p className={css.text}>
          {s.more.backupHint}
          <br />
          {s.more.lastBackup(last ? shortDate(last) + last.slice(0, 4) : null)}
        </p>
        <div className={css.buttons}>
          <button type="button" className="btn btn-primary" onClick={exportData}>
            {s.more.exportBtn}
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            {s.more.importBtn}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.txt,application/json,text/plain"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void importFile(f);
            }}
          />
        </div>
      </section>

      <section className={css.section}>
        <h2 className="section-title">{s.more.categories}</h2>
        <p className={css.text}>{s.more.categoriesHint}</p>
        <ul className={css.list}>
          {categories?.map((c, i) => (
            <li key={c.id} className={css.row}>
              <span className={css.rowName}>{c.name}</span>
              <button
                type="button"
                className="icon-btn icon-btn-plain"
                aria-label={s.more.moveUp(c.name)}
                disabled={i === 0}
                onClick={() => moveCategory(c.id, -1)}
              >
                <Icon name="up" />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-plain"
                aria-label={s.more.moveDown(c.name)}
                disabled={i === categories.length - 1}
                onClick={() => moveCategory(c.id, 1)}
              >
                <Icon name="down" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {!!weeks?.length && (
        <section className={css.section}>
          <h2 className="section-title">{s.more.savedWeeks}</h2>
          <ul className={css.list}>
            {weeks.map((w) => (
              <li key={w.id} className={css.row}>
                <span className={css.rowName}>{w.name}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn-plain"
                  aria-label={s.more.deleteWeek(w.name)}
                  onClick={() => db.weeks.delete(w.id!)}
                >
                  <Icon name="x" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={css.section}>
        <button
          type="button"
          className="btn"
          onClick={async () => toast({ text: s.more.restored(await restoreStarterMeals()) })}
        >
          {s.more.restoreStarters}
        </button>
      </section>

      <p className={css.version}>
        {s.more.version} {__APP_VERSION__}
      </p>
    </Page>
  );
}
