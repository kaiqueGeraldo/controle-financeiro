"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { delayUntilNextProductDay, localDateString, productDateString } from "@/utils/date";

type CalendarToday = { browser: string; product: string };
const BrowserTodayContext = createContext<CalendarToday | null | undefined>(undefined);

function delayUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1, nextDay.getTime() - now.getTime());
}

export function BrowserTodayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState<CalendarToday | null>(null);

  useEffect(() => {
    let timerId: number | undefined;

    const scheduleNextRefresh = () => {
      const now = new Date();
      const browser = localDateString(now);
      const product = productDateString(now);
      setToday((previous) => previous?.browser === browser && previous.product === product
        ? previous : { browser, product });

      if (timerId !== undefined) window.clearTimeout(timerId);
      timerId = window.setTimeout(
        scheduleNextRefresh,
        Math.min(delayUntilNextLocalDay(now), delayUntilNextProductDay(now)),
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleNextRefresh();
    };

    scheduleNextRefresh();
    window.addEventListener("focus", scheduleNextRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId);
      window.removeEventListener("focus", scheduleNextRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <BrowserTodayContext.Provider value={today}>
      {children}
    </BrowserTodayContext.Provider>
  );
}

function useCalendarToday(): CalendarToday | null {
  const today = useContext(BrowserTodayContext);
  if (today === undefined) {
    throw new Error(
      "O calendário deve ser usado dentro de BrowserTodayProvider",
    );
  }
  return today;
}

export function useBrowserToday(): string | null {
  return useCalendarToday()?.browser ?? null;
}

export function useProductToday(): string | null {
  return useCalendarToday()?.product ?? null;
}
