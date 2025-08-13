'use client';

import { DateTime } from 'luxon';

export default function DateTimeDisplay({ isoDate }: { isoDate: string }) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatted = DateTime.fromISO(isoDate, { zone: 'utc' })
    .setZone(timeZone)
    .toFormat('dd LLL yyyy hh:mm a');

  return <span>{formatted}</span>;
}
