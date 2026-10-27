import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Page } from '../components/Page';
import { db } from '../db/db';
import { daysBetween, today } from '../lib/dates';
import { lastCooked } from '../lib/plan';
import { getItem, setItem } from '../lib/storage';
import { searchKey } from '../lib/units';
import { s } from '../strings';
import { MEAL_KINDS, type Meal } from '../types';
import css from './MealsPage.module.css';

type Filter = 'all' | 'fav' | 'baby' | 'long' | 'hidden';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: s.meals.filterAll },
  { id: 'fav', label: s.meals.filterFav },
  { id: 'baby', label: s.meals.filterBaby },
  { id: 'long', label: s.meals.filterLong },
  { id: 'hidden', label: s.meals.filterHidden },
];

export function MealsPage() {
  const meals = useLiveQuery(() => db.meals.toArray(), []);
  const plan = useLiveQuery(() => db.plan.toArray(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilterState] = useState<Filter>(() => (getItem('mealsFilter') as Filter | null) ?? 'all');
  const now = today();
  const cooked = useMemo(() => lastCooked(plan ?? [], now), [plan, now]);

  const groups = useMemo(() => {
    const q = searchKey(query);
    let list = (meals ?? [])
      .filter((m) => (filter === 'hidden' ? m.hidden : !m.hidden))
      .filter((m) => !q || searchKey(m.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'bs'));
    if (filter === 'fav') list = list.filter((m) => m.favourite);
    if (filter === 'baby') list = list.filter((m) => m.forBaby);
    if (filter === 'long') {
      // Oldest first; never cooked at the end.
      const key = (m: Meal) => cooked.get(m.id) ?? '9999';
      return [{ title: '', items: list.filter((m) => m.kind !== 'beba').sort((a, b) => key(a).localeCompare(key(b))) }];
    }
    if (q || filter !== 'all') return [{ title: '', items: list }];
    return MEAL_KINDS.map((k) => ({ title: s.kinds[k], items: list.filter((m) => m.kind === k) })).filter((g) => g.items.length);
  }, [meals, query, filter, cooked]);

  if (!meals) return null;

  function setFilter(f: Filter) {
    setFilterState(f);
    setItem('mealsFilter', f);
  }

  function meta(m: Meal): string {
    const last = cooked.get(m.id);
    const parts = [s.meals.ingredientsCount(m.ingredients.length)];
    if (m.days > 1) parts.push(s.meals.lasts(m.days));
    if (filter === 'long') parts.push(last ? s.picker.lastCooked(daysBetween(last, now)) : s.picker.never);
    return parts.join(' · ');
  }

  return (
    <Page
      title={s.meals.title}
      actions={
        <Link to="/jela/novo" className="icon-btn" aria-label={s.meals.newMeal}>
          <Icon name="plus" />
        </Link>
      }
    >
      <div className={css.search}>
        <label className="sr-only" htmlFor="meal-search">
          {s.meals.search}
        </label>
        <input
          id="meal-search"
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.meals.search}
          autoComplete="off"
        />
      </div>
      <div className={css.filters}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {groups.every((g) => !g.items.length) && <p className={css.none}>{s.meals.none}</p>}
      {groups.map((g, gi) => (
        <section key={gi}>
          {g.title && <h2 className="section-title">{g.title}</h2>}
          <ul className={css.list}>
            {g.items.map((m) => (
              <li key={m.id} className={`${css.row} ${m.hidden ? css.hidden : ''}`}>
                <Link to={`/jela/${m.id}`} className={css.link}>
                  <span className={css.name}>{m.name}</span>
                  <span className={css.meta}>{meta(m)}</span>
                </Link>
                <button
                  type="button"
                  className={`icon-btn icon-btn-plain ${m.favourite ? css.starOn : css.star}`}
                  aria-label={m.favourite ? s.meals.removeFavourite(m.name) : s.meals.addFavourite(m.name)}
                  aria-pressed={m.favourite}
                  onClick={() => db.meals.update(m.id, { favourite: !m.favourite })}
                >
                  <Icon name="star" filled={m.favourite} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}
