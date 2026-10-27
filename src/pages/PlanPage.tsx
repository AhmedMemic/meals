import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import formCss from '../components/Form.module.css';
import { Icon } from '../components/Icon';
import { Page } from '../components/Page';
import { DayCard } from '../components/plan/DayCard';
import { MealPicker } from '../components/plan/MealPicker';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import {
  addMealToPlan,
  addPlanToList,
  applySavedWeek,
  clearWeek,
  copyWeek,
  removePlanEntry,
  saveWeek,
  setLeftover,
} from '../db/actions';
import { db } from '../db/db';
import { addDays, dayIndex, shortDate, today, weekDays, weekStart } from '../lib/dates';
import { lastCooked } from '../lib/plan';
import { s } from '../strings';
import type { PlanEntry, Slot } from '../types';
import css from './PlanPage.module.css';

type Dialog =
  | { kind: 'pick'; date: string; slot: Slot }
  | { kind: 'entry'; entry: PlanEntry }
  | { kind: 'menu' }
  | { kind: 'save' }
  | { kind: 'load' };

export function PlanPage() {
  const now = today();
  const [start, setStart] = useState(() => weekStart(now));
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [weekName, setWeekName] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const days = weekDays(start);
  const entries = useLiveQuery(() => db.plan.toArray(), []);
  const mealList = useLiveQuery(() => db.meals.toArray(), []);
  const saved = useLiveQuery(() => db.weeks.toArray(), []);
  const meals = useMemo(() => new Map((mealList ?? []).map((m) => [m.id, m])), [mealList]);
  const cooked = useMemo(() => lastCooked(entries ?? [], now), [entries, now]);

  if (!entries || !mealList) return null;

  const week = entries.filter((e) => e.date >= days[0]! && e.date <= days[6]!).sort((a, b) => a.id! - b.id!);
  const toAdd = week.filter((e) => !e.leftover && !e.inList).length;
  const isThisWeek = start === weekStart(now);

  async function addToList() {
    const n = await addPlanToList(start);
    toast({ text: s.plan.addedToList(n), action: { label: s.tabs.list, run: () => navigate('/lista') } });
  }

  const close = () => setDialog(null);

  return (
    <Page
      title={s.plan.title}
      actions={
        <button type="button" className="icon-btn" aria-label={s.common.more} onClick={() => setDialog({ kind: 'menu' })}>
          <Icon name="dots" size={20} />
        </button>
      }
    >
      <div className={css.nav}>
        <button type="button" className="icon-btn" aria-label={s.plan.prevWeek} onClick={() => setStart(addDays(start, -7))}>
          <Icon name="left" />
        </button>
        <button type="button" className={`btn btn-ghost ${css.range}`} onClick={() => setStart(weekStart(now))}>
          <span>
            {shortDate(days[0]!)} – {shortDate(days[6]!)}
            <span className={css.rangeSub}>{isThisWeek ? s.plan.thisWeek : ' '}</span>
          </span>
        </button>
        <button type="button" className="icon-btn" aria-label={s.plan.nextWeek} onClick={() => setStart(addDays(start, 7))}>
          <Icon name="right" />
        </button>
      </div>

      <button type="button" className={`btn btn-primary ${css.toList}`} disabled={!toAdd} onClick={addToList}>
        <Icon name="list" size={20} />
        {toAdd ? s.plan.addToList(toAdd) : s.plan.allInList}
      </button>

      {days.map((d) => (
        <DayCard
          key={d}
          date={d}
          isToday={d === now}
          entries={week.filter((e) => e.date === d)}
          meals={meals}
          onAdd={(slot) => setDialog({ kind: 'pick', date: d, slot })}
          onEntry={(entry) => setDialog({ kind: 'entry', entry })}
        />
      ))}

      {dialog?.kind === 'pick' && (
        <MealPicker
          title={s.picker.title(s.slots[dialog.slot], `${s.weekdaysShort[dayIndex(dialog.date)]} ${shortDate(dialog.date)}`)}
          slot={dialog.slot}
          meals={mealList}
          lastCooked={cooked}
          onClose={close}
          onPick={async (meal, n) => {
            await addMealToPlan(dialog.date, dialog.slot, meal.id, n);
            close();
          }}
        />
      )}

      {dialog?.kind === 'entry' && (
        <Sheet title={meals.get(dialog.entry.mealId)?.name ?? s.plan.entryMenu} onClose={close}>
          <div className={formCss.menu}>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                await setLeftover(dialog.entry.id!, !dialog.entry.leftover);
                close();
              }}
            >
              {dialog.entry.leftover ? s.plan.markCooked : s.plan.markLeftover}
            </button>
            <button type="button" className="btn" onClick={() => navigate(`/jela/${dialog.entry.mealId}`)}>
              {s.plan.openMeal}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                await removePlanEntry(dialog.entry.id!);
                close();
              }}
            >
              {entries.some((e) => e.sourceId === dialog.entry.id) ? s.plan.removeWithLeftovers : s.plan.removeEntry}
            </button>
          </div>
        </Sheet>
      )}

      {dialog?.kind === 'menu' && (
        <Sheet title={s.plan.title} onClose={close}>
          <div className={formCss.menu}>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const n = await copyWeek(addDays(start, -7), start);
                toast({ text: s.plan.copied(n) });
                close();
              }}
            >
              {s.plan.copyLastWeek}
            </button>
            <button type="button" className="btn" disabled={!week.length} onClick={() => setDialog({ kind: 'save' })}>
              {s.plan.saveWeek}
            </button>
            <button type="button" className="btn" onClick={() => setDialog({ kind: 'load' })}>
              {s.plan.loadWeek}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!week.length}
              onClick={async () => {
                if (!confirm(s.plan.confirmClear)) return;
                await clearWeek(start);
                close();
              }}
            >
              {s.plan.clearWeek}
            </button>
          </div>
        </Sheet>
      )}

      {dialog?.kind === 'save' && (
        <Sheet title={s.plan.saveWeek} onClose={close}>
          <form
            className={formCss.form}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!weekName.trim()) return;
              await saveWeek(weekName, start);
              setWeekName('');
              toast({ text: s.plan.weekSaved });
              close();
            }}
          >
            <label className={formCss.field}>
              <span className={formCss.label}>{s.plan.saveWeekName}</span>
              <input
                className="input"
                value={weekName}
                onChange={(e) => setWeekName(e.target.value)}
                placeholder={s.plan.saveWeekPlaceholder}
                required
                autoFocus
              />
            </label>
            <div className={formCss.actions}>
              <button type="submit" className="btn btn-primary">
                {s.common.save}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {dialog?.kind === 'load' && (
        <Sheet title={s.plan.loadWeek} onClose={close}>
          {!saved?.length && <p className="muted">{s.plan.noSavedWeeks}</p>}
          <ul className={css.weeks}>
            {saved?.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    await applySavedWeek(w.id!, start);
                    close();
                  }}
                >
                  {w.name}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </Page>
  );
}
