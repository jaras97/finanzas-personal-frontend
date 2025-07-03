import api from "@/lib/api";
import { toast } from "sonner";

export const reverseTransaction = async (id: number, refresh: () => void) => {
  try {
    await api.post(`/transactions/${id}/reverse`);
    toast.success(`Transacción #${id} reversada correctamente.`);
    refresh();
  } catch (error: any) {
    toast.error(
      error?.response?.data?.detail || "Error al reversar transacción"
    );
  }
};