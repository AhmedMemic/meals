import { SLOTS, type Meal, type PlanEntry, type Slot } from '../../types';
import { dayIndex, shortDate } from '../../lib/dates';
import { s } from '../../strings';
import { Icon } from '../Icon';
import css from './DayCard.module.css';

interface Props {
  date: string;
  isToday: boolean;
  entries: PlanEntry[];
  meals: Map<string, Meal>;
  onAdd: (slot: Slot) => void;
  onEntry: (entry: PlanEntry) => void;
}

const ALWAYS: Slot[] = ['vecera'];

export function DayCard({ date, isToday, entries, meals, onAdd, onEntry }: Props) {
  const shown = SLOTS.filter((slot) => ALWAYS.includes(slot) || entries.some((e) => e.slot === slot));
  const hidden = SLOTS.filter((slot) => !shown.includes(slot));
  const di = dayIndex(date);

  return (
    <section className={`${css.card} ${isToday ? css.today : ''}`} aria-label={`${s.weekdays[di]} ${shortDate(date)}`}>
      <div className={css.head}>
        <h2 className={css.day}>{s.weekdays[di]}</h2>
        <span className={css.date}>{shortDate(date)}</span>
        {isToday && <span className={css.badge}>{s.plan.today}</span>}
      </div>
      {shown.map((slot) => (
        <div key={slot} className={css.slot}>
          <span className={css.slotName}>{s.slots[slot]}</span>
          <div className={css.entries}>
            {entries
              .filter((e) => e.slot === slot)
              .map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`${css.entry} ${e.leftover ? css.leftover : ''}`}
                  onClick={() => onEntry(e)}
                >
                  {meals.get(e.mealId)?.name ?? '?'}
                  {e.leftover && <span className={css.tag}>{s.plan.leftover}</span>}
                  {e.inList && !e.leftover && (
                    <span className={css.inList} title={s.plan.inList}>
                      <Icon name="check" size={14} />
                      <span className="sr-only">{s.plan.inList}</span>
                    </span>
                  )}
                </button>
              ))}
            <button
              type="button"
              className={css.addInSlot}
              aria-label={`${s.plan.addMeal}: ${s.slots[slot]}, ${s.weekdays[di]}`}
              onClick={() => onAdd(slot)}
            >
              <Icon name="plus" size={18} />
            </button>
          </div>
        </div>
      ))}
      {hidden.length > 0 && (
        <div className={css.more}>
          {hidden.map((slot) => (
            <button key={slot} type="button" className={css.moreBtn} onClick={() => onAdd(slot)}>
              {s.plan.addSlot(s.slots[slot])}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
