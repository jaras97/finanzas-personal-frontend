// src/lib/extractErrorMessage.ts
import axios, { AxiosError } from "axios";

type PydanticErrorItem = {
  type?: string;
  loc?: Array<string | number> | string;
  msg?: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPydanticErrorItem(v: unknown): v is PydanticErrorItem {
  return (
    isRecord(v) &&
    ("msg" in v || "loc" in v || "type" in v || "input" in v || "ctx" in v)
  );
}

function stringifySafe(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<unknown>;
    const data = ax.response?.data as unknown;
    const detail = isRecord(data) ? (data as Record<string, unknown>).detail : undefined;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      // Pydantic v2 validation errors (array)
      const parts = detail.map((d) => {
        if (isPydanticErrorItem(d)) {
          const loc = Array.isArray(d.loc) ? d.loc.join(".") : d.loc;
          if (d.msg) return loc ? `${loc}: ${d.msg}` : d.msg;
        }
        return stringifySafe(d);
      });
      const msg = parts.filter(Boolean).join(" | ");
      return msg || ax.message || "Request error";
    }

    if (isRecord(detail)) {
      // { message: "..."} u otros objetos
      const maybe = detail.message;
      if (typeof maybe === "string") return maybe;
      return stringifySafe(detail);
    }

    return ax.message || "Request error";
  }

  return err instanceof Error ? err.message : "Unexpected error";
}
