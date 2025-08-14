// utils/dates.ts
export const toIsoAtLocalNoon = (dateStr: string) => {
  // dateStr = "YYYY-MM-DD"
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0); // 12:00 hora local
  return dt.toISOString();
};
