import { useMemo, useState } from 'react';
import { MEAL_KINDS, type Meal, type Slot } from '../../types';
import { daysBetween, today } from '../../lib/dates';
import { searchKey } from '../../lib/units';
import { s } from '../../strings';
import { Sheet } from '../Sheet';
import css from './MealPicker.module.css';

interface Props {
  title: string;
  slot: Slot;
  meals: Meal[];
  lastCooked: Map<string, string>;
  onPick: (meal: Meal, days: number) => void;
  onClose: () => void;
}

const DAY_OPTIONS = [1, 2, 3];
const SUGGEST_AFTER_DAYS = 21;

export function MealPicker({ title, slot, meals, lastCooked, onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [days, setDays] = useState<number | null>(null);
  const now = today();

  const visible = useMemo(() => {
    const all = meals.filter((m) => !m.hidden).sort((a, b) => a.name.localeCompare(b.name, 'bs'));
    // Baby slot: baby meals first; other slots: baby-only meals last.
    return slot === 'beba'
      ? [...all.filter((m) => m.forBaby), ...all.filter((m) => !m.forBaby)]
      : all.filter((m) => m.kind !== 'beba');
  }, [meals, slot]);

  const q = searchKey(query);
  const groups = useMemo(() => {
    if (q) return [{ title: '', items: visible.filter((m) => searchKey(m.name).includes(q)) }];
    const fav = visible.filter((m) => m.favourite);
    // Meals we cooked before but not for a while, longest ago first.
    const long = visible
      .filter((m) => {
        const last = lastCooked.get(m.id);
        return last && daysBetween(last, now) >= SUGGEST_AFTER_DAYS;
      })
      .sort((a, b) => lastCooked.get(a.id)!.localeCompare(lastCooked.get(b.id)!))
      .slice(0, 5);
    const out = [];
    if (slot === 'beba') out.push({ title: s.picker.forBaby, items: visible.filter((m) => m.forBaby) });
    if (fav.length) out.push({ title: s.picker.favourites, items: fav });
    if (long.length) out.push({ title: s.picker.suggestions, items: long });
    for (const kind of MEAL_KINDS) {
      const items = visible.filter((m) => m.kind === kind);
      if (items.length && !(slot === 'beba' && kind === 'beba')) out.push({ title: s.kinds[kind], items });
    }
    return out;
  }, [q, visible, lastCooked, now, slot]);

  function meta(m: Meal): string {
    const last = lastCooked.get(m.id);
    const ago = last ? s.picker.lastCooked(daysBetween(last, now)) : '';
    return [m.days > 1 ? s.meals.lasts(m.days) : '', ago].filter(Boolean).join(' · ');
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <div className={css.top}>
        <label className="sr-only" htmlFor="picker-search">
          {s.picker.search}
        </label>
        <input
          id="picker-search"
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.picker.search}
          autoComplete="off"
        />
        <div className={css.days} role="group" aria-label={s.picker.lasts}>
          <span className={css.daysLabel}>{s.picker.lasts}:</span>
          {DAY_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              aria-pressed={days === n}
              onClick={() => setDays(days === n ? null : n)}
            >
              {s.picker.days(n)}
            </button>
          ))}
        </div>
      </div>
      {groups.every((g) => !g.items.length) && <p className={css.none}>{s.picker.none}</p>}
      {groups.map(
        (g, gi) =>
          g.items.length > 0 && (
            <section key={gi} className={css.group}>
              {g.title && <h3 className="section-title">{g.title}</h3>}
              <ul className={css.list}>
                {g.items.map((m) => (
                  <li key={m.id}>
                    <button type="button" className={css.meal} onClick={() => onPick(m, days ?? m.days)}>
                      <span className={css.name}>{m.name}</span>
                      <span className={css.meta}>{meta(m)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </Sheet>
  );
}
