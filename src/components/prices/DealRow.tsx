import { storeName } from '../../data/stores';
import { shortDate } from '../../lib/dates';
import { discount, formatKm } from '../../lib/prices';
import { s } from '../../strings';
import type { Deal } from '../../types';
import { Icon } from '../Icon';
import css from './Prices.module.css';

interface Props {
  deal: Deal;
  showStore: boolean;
  onAdd: () => void;
}

export function DealRow({ deal, showStore, onAdd }: Props) {
  const pct = discount(deal);
  const when = deal.validTo
    ? s.deals.until(shortDate(deal.validTo))
    : deal.validFrom
      ? s.deals.from(shortDate(deal.validFrom))
      : null;
  return (
    <li className={css.deal}>
      <div className={css.dealText}>
        <span className={css.dealName}>{deal.name}</span>
        <span className={css.dealMeta}>
          {[showStore && storeName(deal.store), when].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div className={css.dealPrice}>
        <span className={css.price}>
          {formatKm(deal.price)}
          {deal.unit && <span className={css.unit}> / {deal.unit}</span>}
        </span>
        {deal.oldPrice && pct !== null && (
          <span className={css.old}>
            <del>{formatKm(deal.oldPrice)}</del> <span className={css.pct}>−{pct}%</span>
          </span>
        )}
      </div>
      <button type="button" className="icon-btn icon-btn-plain" aria-label={s.deals.addToList(deal.name)} onClick={onAdd}>
        <Icon name="plus" size={20} />
      </button>
    </li>
  );
}
