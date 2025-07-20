declare module 'date-fns-tz' {
  export function zonedTimeToUtc(date: Date | string | number, timeZone: string): Date;
  export function utcToZonedTime(date: Date | string | number, timeZone: string): Date;
  export function format(date: Date | string | number, fmt: string, options: { timeZone: string }): string;
}