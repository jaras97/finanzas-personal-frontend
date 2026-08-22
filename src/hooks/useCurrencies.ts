"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Currency } from "@/types";
import axios from "axios";

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/currencies");
      setCurrencies(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || "Error al cargar monedas");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  return {
    currencies,
    loading,
    refresh: fetchCurrencies,
  };
};
