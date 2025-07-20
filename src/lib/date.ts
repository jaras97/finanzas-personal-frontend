// lib/date.ts
import { DateTime } from "luxon";

export function toLocalDateString(date: Date): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return DateTime.fromJSDate(date)
    .setZone(timeZone)
    .toFormat("yyyy-MM-dd");
}