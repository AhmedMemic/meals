import type { ReactNode } from 'react';
import css from './Page.module.css';

interface Props {
  title: string;
  subtitle?: string;
  /** Left of the title, e.g. a back button. */
  before?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function Page({ title, subtitle, before, actions, children }: Props) {
  return (
    <main className={css.page}>
      <header className={css.header}>
        {before}
        <div className={css.titles}>
          <h1 className={css.title}>{title}</h1>
          {subtitle && <p className={css.subtitle}>{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
