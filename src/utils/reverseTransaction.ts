import api from "@/lib/api";

export async function reverseTransaction(id: number, note?: string) {
  const { data } = await api.post(`/transactions/${id}/reverse`, { note });
  return data;
}
