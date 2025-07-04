import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

export const reverseTransaction = async (id: number, refresh: () => void) => {
  try {
    await api.post(`/transactions/${id}/reverse`);
    toast.success(`Transacción #${id} reversada correctamente.`);
    refresh();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      toast.error(
        error?.response?.data?.detail || "Error al reversar transacción"
      );
    }
  }
};