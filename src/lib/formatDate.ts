import { DateTime } from "luxon";

export function formatDateInUserTimeZone(
  isoDate: string,
  format: string = "dd LLL yyyy"
): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return DateTime.fromISO(isoDate, { zone: "utc" })
    .setZone(timeZone)
    .toFormat(format);
}