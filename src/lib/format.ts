import { currencyType } from "@/types";

export function formatCurrency(
  amount: number,
  currency: currencyType  = "COP"
): string {
  const symbols: Record<typeof currency, string> = {
    COP: "$",
    USD: "$",
  };

  const formatter = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${symbols[currency]} ${formatter.format(amount)}`;
}