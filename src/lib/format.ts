export function formatCurrency(
  amount: number,
  currency: "COP" | "USD" | "EUR" = "COP"
): string {
  const symbols: Record<typeof currency, string> = {
    COP: "$",
    USD: "$",
    EUR: "€",
  };

  const formatter = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${symbols[currency]} ${formatter.format(amount)}`;
}