import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import formCss from '../components/Form.module.css';
import { Icon } from '../components/Icon';
import { Page } from '../components/Page';
import { useToast } from '../components/Toast';
import { deleteMeal, newMealId, saveMeal } from '../db/actions';
import { db } from '../db/db';
import { normalizeKey } from '../lib/units';
import { s } from '../strings';
import { MEAL_KINDS, UNITS, type CategoryId, type Meal, type MealKind, type Unit } from '../types';
import css from './MealEditPage.module.css';

interface Row {
  name: string;
  amount: string;
  unit: Unit;
  category: CategoryId;
}

const emptyMeal = (): Meal => ({
  id: newMealId(),
  name: '',
  kind: 'kuhano',
  days: 1,
  ingredients: [],
  notes: '',
  favourite: false,
  hidden: false,
  forBaby: false,
  builtin: false,
});

const emptyRow = (): Row => ({ name: '', amount: '', unit: 'kom', category: 'ostalo' });

export function MealEditPage() {
  const { id } = useParams();
  const isNew = id === 'novo';
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const stored = useLiveQuery(async () => (isNew ? null : ((await db.meals.get(id!)) ?? null)), [id]);
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []);
  const catalog = useLiveQuery(() => db.catalog.toArray(), []);
  const byKey = useMemo(() => new Map((catalog ?? []).map((c) => [c.key, c])), [catalog]);

  const [meal, setMeal] = useState<Meal | null>(isNew ? emptyMeal() : null);
  const [rows, setRows] = useState<Row[]>(isNew ? [emptyRow()] : []);

  // Load the stored meal once into the form.
  useEffect(() => {
    if (!stored || meal) return;
    setMeal(stored);
    setRows(
      stored.ingredients.map((i) => ({
        name: i.name,
        amount: i.amount === null ? '' : String(i.amount).replace('.', ','),
        unit: i.unit,
        category: i.category,
      })),
    );
  }, [stored, meal]);

  // Opened directly (no history inside the app): go to the meal list.
  const back = () => (location.key === 'default' ? navigate('/jela', { replace: true }) : navigate(-1));

  if (stored === null && !isNew) {
    return (
      <Page title={s.mealEdit.titleEdit} before={<BackButton onClick={back} />}>
        <p className="muted">{s.mealEdit.notFound}</p>
      </Page>
    );
  }
  if (!meal || !categories) return null;

  const set = <K extends keyof Meal>(k: K, v: Meal[K]) => setMeal({ ...meal, [k]: v });

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r;
        const next = { ...r, ...patch };
        // Known item: take its category (and unit while no amount is typed).
        const known = patch.name !== undefined ? byKey.get(normalizeKey(patch.name)) : undefined;
        if (known) {
          next.category = known.category;
          if (!next.amount && known.unit) next.unit = known.unit;
        }
        return next;
      }),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!meal!.name.trim()) {
      toast({ text: s.mealEdit.nameRequired });
      return;
    }
    const ingredients = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const n = Number(r.amount.replace(',', '.'));
        return {
          name: r.name.trim(),
          amount: r.amount.trim() && n > 0 ? n : null,
          unit: r.unit,
          category: r.category,
        };
      });
    await saveMeal({ ...meal!, name: meal!.name.trim(), ingredients });
    back();
  }

  async function remove() {
    if (!confirm(s.mealEdit.confirmDelete(meal!.name))) return;
    await deleteMeal(meal!.id);
    navigate('/jela', { replace: true });
  }

  return (
    <Page title={isNew ? s.mealEdit.titleNew : s.mealEdit.titleEdit} before={<BackButton onClick={back} />}>
      <form className={css.form} onSubmit={submit}>
        <label className={formCss.field}>
          <span className={formCss.label}>{s.mealEdit.name}</span>
          <input className="input" value={meal.name} onChange={(e) => set('name', e.target.value)} required />
        </label>

        <div className={css.twoCols}>
          <label className={formCss.field}>
            <span className={formCss.label}>{s.mealEdit.kind}</span>
            <select className="select" value={meal.kind} onChange={(e) => set('kind', e.target.value as MealKind)}>
              {MEAL_KINDS.map((k) => (
                <option key={k} value={k}>
                  {s.kinds[k]}
                </option>
              ))}
            </select>
          </label>
          <label className={formCss.field}>
            <span className={formCss.label}>{s.mealEdit.days}</span>
            <select className="select" value={meal.days} onChange={(e) => set('days', Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {s.picker.days(n)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={css.checks}>
          <label className={formCss.check}>
            <input type="checkbox" checked={meal.favourite} onChange={(e) => set('favourite', e.target.checked)} />
            {s.mealEdit.favourite}
          </label>
          <label className={formCss.check}>
            <input type="checkbox" checked={meal.forBaby} onChange={(e) => set('forBaby', e.target.checked)} />
            {s.mealEdit.forBaby}
          </label>
          <label className={formCss.check}>
            <input type="checkbox" checked={meal.hidden} onChange={(e) => set('hidden', e.target.checked)} />
            {s.mealEdit.hidden}
          </label>
        </div>

        <section>
          <h2 className="section-title">{s.mealEdit.ingredients}</h2>
          <p className={css.hint}>{s.mealEdit.ingredientsHint}</p>
          <datalist id="catalog-names">
            {catalog?.map((c) => <option key={c.key} value={c.name} />)}
          </datalist>
          <ul className={css.ingredients}>
            {rows.map((r, i) => (
              <li key={i} className={css.ing}>
                <input
                  className={`input ${css.ingName}`}
                  aria-label={s.mealEdit.ingredientName}
                  placeholder={s.mealEdit.ingredientName}
                  list="catalog-names"
                  value={r.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                />
                <input
                  className="input"
                  aria-label={s.mealEdit.amount}
                  placeholder="—"
                  inputMode="decimal"
                  value={r.amount}
                  onChange={(e) => setRow(i, { amount: e.target.value })}
                />
                <select
                  className="select"
                  aria-label={s.mealEdit.unit}
                  value={r.unit}
                  onChange={(e) => setRow(i, { unit: e.target.value as Unit })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  aria-label={s.mealEdit.category}
                  value={r.category}
                  onChange={(e) => setRow(i, { category: e.target.value as CategoryId })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-btn icon-btn-plain"
                  aria-label={s.mealEdit.removeIngredient(r.name)}
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <Icon name="x" size={20} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost" onClick={() => setRows([...rows, emptyRow()])}>
            {s.mealEdit.addIngredient}
          </button>
        </section>

        <label className={formCss.field}>
          <span className={formCss.label}>{s.mealEdit.notes}</span>
          <textarea className="textarea" value={meal.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        <div className={css.bar}>
          {!isNew ? (
            <button type="button" className="btn btn-danger" onClick={remove}>
              {s.mealEdit.deleteMeal}
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-primary">
            {s.common.save}
          </button>
        </div>
      </form>
    </Page>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="icon-btn icon-btn-plain" aria-label={s.common.back} onClick={onClick}>
      <Icon name="left" />
    </button>
  );
}
