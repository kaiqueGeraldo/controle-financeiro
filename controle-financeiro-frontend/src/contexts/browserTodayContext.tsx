"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { localDateString } from "@/utils/date";

const BrowserTodayContext = createContext<string | null | undefined>(undefined);

function delayUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1, nextDay.getTime() - now.getTime());
}

export function BrowserTodayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    let timerId: number | undefined;

    const scheduleNextRefresh = () => {
      const now = new Date();
      setToday(localDateString(now));

      if (timerId !== undefined) window.clearTimeout(timerId);
      timerId = window.setTimeout(
        scheduleNextRefresh,
        delayUntilNextLocalDay(now),
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

export function useBrowserToday(): string | null {
  const today = useContext(BrowserTodayContext);
  if (today === undefined) {
    throw new Error(
      "useBrowserToday deve ser usado dentro de BrowserTodayProvider",
    );
  }
  return today;
}
