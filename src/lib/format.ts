export function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-CO", { style: "currency", currency: "COP" });
}