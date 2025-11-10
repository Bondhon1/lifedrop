"use client";

import { track } from "@vercel/analytics";

// Allowed input values for analytics properties (undefined allowed in input)
type AnalyticsValue = string | number | boolean | null;
export type AnalyticsPayload = Record<string, AnalyticsValue | undefined>;

const isAnalyticsRuntime =
  typeof window !== "undefined" && typeof track === "function";

export function logAnalyticsEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (!isAnalyticsRuntime) {
    return;
  }

  try {
    track(eventName, sanitizePayload(payload));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[analytics] Failed to track "${eventName}"`, error);
    }
  }
}

function sanitizePayload(payload: AnalyticsPayload): Record<string, AnalyticsValue> {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined) as [string, AnalyticsValue][];
  return Object.fromEntries(entries);
}

