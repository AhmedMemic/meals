import { useState } from 'react';
import { backupDue, createBackup, lastBackup, shareBackup } from '../lib/backup';
import { daysBetween, today } from '../lib/dates';
import { s } from '../strings';
import { useToast } from './Toast';
import css from './BackupReminder.module.css';

export function BackupReminder() {
  const [, refresh] = useState(0);
  const toast = useToast();
  if (!backupDue()) return null;
  const last = lastBackup();

  async function backup() {
    const r = await shareBackup(await createBackup());
    if (r !== 'cancelled') toast({ text: s.more.exported });
    refresh((n) => n + 1);
  }

  return (
    <div className={css.box}>
      <p className={css.text}>{last ? s.backupReminder.old(daysBetween(last, today())) : s.backupReminder.never}</p>
      <button type="button" className="btn btn-primary" onClick={backup}>
        {s.backupReminder.action}
      </button>
    </div>
  );
}
