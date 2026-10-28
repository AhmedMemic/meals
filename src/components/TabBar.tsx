import { NavLink } from 'react-router-dom';
import { s } from '../strings';
import { Icon, type IconName } from './Icon';
import css from './TabBar.module.css';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/plan', label: s.tabs.plan, icon: 'plan' },
  { to: '/lista', label: s.tabs.list, icon: 'list' },
  { to: '/akcije', label: s.tabs.deals, icon: 'tag' },
  { to: '/jela', label: s.tabs.meals, icon: 'meals' },
  { to: '/vise', label: s.tabs.more, icon: 'more' },
];

export function TabBar() {
  return (
    <nav className={css.bar} aria-label="Glavna navigacija">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `${css.tab} ${isActive ? css.active : ''}`}>
          <Icon name={t.icon} size={24} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
