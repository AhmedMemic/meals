import { useEffect, useId, type ReactNode } from 'react';
import { s } from '../strings';
import { Icon } from './Icon';
import css from './Sheet.module.css';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet. Render it only while open. */
export function Sheet({ title, onClose, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className={css.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={css.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={css.head}>
          <h2 id={titleId} className={css.title}>
            {title}
          </h2>
          <button type="button" className="icon-btn icon-btn-plain" aria-label={s.common.close} onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className={css.body}>{children}</div>
      </div>
    </div>
  );
}
