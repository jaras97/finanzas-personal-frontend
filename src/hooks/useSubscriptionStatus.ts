// src/hooks/useSubscriptionStatus.ts

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { SubscriptionStatusRead } from "@/types";
import axios from "axios";

type SubscriptionStatus = "loading" | "none" | "expired" | "inactive" | "expiring_soon" | "active";

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus>("loading");
  const [subscription, setSubscription] = useState<SubscriptionStatusRead | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get("/subscriptions/me");
        setSubscription(data);

        const now = new Date();
        const endDate = new Date(data.end_date);
        const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (!data.is_active) {
          setStatus("inactive");
        } else if (endDate < now) {
          setStatus("expired");
        } else if (daysLeft < 7) {
          setStatus("expiring_soon");
        } else {
          setStatus("active");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("❌ Error al obtener suscripción:", error.response);
            if (error.response?.status === 404) {
                setStatus("none");
            } else {
                setStatus("none");
            }
        }
      }
    };

    fetchStatus();
  }, []);

  return { status, subscription };
}