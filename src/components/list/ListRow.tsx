import type { Deal, ListItem } from '../../types';
import { storeName } from '../../data/stores';
import { formatKm } from '../../lib/prices';
import { formatQtyList } from '../../lib/units';
import { s } from '../../strings';
import { Icon } from '../Icon';
import css from './ListRow.module.css';

interface Props {
  item: ListItem;
  /** Current sale for this item, if any. */
  deal?: Deal;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

export function ListRow({ item, deal, onToggle, onOpen, onDelete }: Props) {
  return (
    <li className={`${css.row} ${item.checked ? css.done : ''}`}>
      <button
        type="button"
        className={css.check}
        aria-label={item.checked ? s.list.unmark(item.name) : s.list.markBought(item.name)}
        onClick={onToggle}
      >
        <span className={css.circle}>{item.checked && <Icon name="check" size={14} />}</span>
      </button>
      <button type="button" className={css.body} onClick={onOpen}>
        <span className={css.text}>
          <span className={css.name}>{item.name}</span>
          {!item.checked && item.sources.length > 0 && (
            <span className={css.sources}>
              {item.sources.join(' · ')}
            </span>
          )}
          {!item.checked && deal && (
            <span className={css.sale}>
              {s.prices.onSale} · {storeName(deal.store)} {formatKm(deal.price)}
            </span>
          )}
        </span>
        <span className={css.qty}>{formatQtyList(item.qty)}</span>
      </button>
      <button type="button" className={css.delete} aria-label={s.list.remove(item.name)} onClick={onDelete}>
        <Icon name="x" size={18} />
      </button>
    </li>
  );
}
