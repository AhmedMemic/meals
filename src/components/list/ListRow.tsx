import type { ListItem } from '../../types';
import { formatQtyList } from '../../lib/units';
import { s } from '../../strings';
import { Icon } from '../Icon';
import css from './ListRow.module.css';

interface Props {
  item: ListItem;
  onToggle: () => void;
  onOpen: () => void;
}

export function ListRow({ item, onToggle, onOpen }: Props) {
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
        </span>
        <span className={css.qty}>{formatQtyList(item.qty)}</span>
      </button>
    </li>
  );
}
