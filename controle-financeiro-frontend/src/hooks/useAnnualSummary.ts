import { useState, useEffect, useCallback, useRef } from "react";
import { annualSummaryService } from "@/services/annualSummaryService";
import { AnnualSummaryResponse } from "@/types";
import { useUser } from "./useUser";
import { useToast } from "@/contexts/toastContext";
import {
  isAbortError,
  useRequestCoordinator,
} from "./useRequestCoordinator";

export function useAnnualSummary() {
  const { user, isLoading: isUserLoading } = useUser();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [summary, setSummary] = useState<AnnualSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const toast = useToast();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);

  // --- CACHE DE MEMÓRIA ---
  const summaryCache = useRef<Record<string, AnnualSummaryResponse>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSummary = useCallback(
    async (selectedYear: number, forceRefresh = false) => {
      if (isUserLoading || !userId) return;
      const cacheKey = `${userId}:${selectedYear}`;

      if (!forceRefresh && summaryCache.current[cacheKey]) {
        setSummary(summaryCache.current[cacheKey]);
        setNoteContent(summaryCache.current[cacheKey].note || "");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      const request = requests.begin("annual-summary");

      timerRef.current = setTimeout(async () => {
        try {
          const res = await annualSummaryService.getSummary(
            selectedYear,
            request.signal,
          );
          if (request.isCurrent() && res?.data) {
            setSummary(res.data);
            setNoteContent(res.data.note || "");
            summaryCache.current[cacheKey] = res.data;
          }
        } catch (error: unknown) {
          if (request.isCurrent() && !isAbortError(error)) {
            console.error("Erro ao buscar resumo anual:", error);
          }
        } finally {
          if (request.isCurrent()) setIsLoading(false);
          request.finish();
        }
      }, 350);
    },
    [userId, isUserLoading, requests],
  );

  // Limpeza no unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requests.invalidate();
    };
  }, [requests]);

  useEffect(() => {
    summaryCache.current = {};
    setSummary(null);
    setNoteContent("");
    if (isUserLoading) setIsLoading(true);
    else if (!userId) setIsLoading(false);
  }, [userId, isUserLoading]);

  useEffect(() => {
    fetchSummary(year);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [year, fetchSummary]);

  const saveNote = async () => {
    if (summary?.note === noteContent) return;

    setIsSavingNote(true);
    const savedYear = year;
    const request = requests.begin(`annual-note:${savedYear}`);
    const cacheKey = userId ? `${userId}:${savedYear}` : null;

    try {
      await annualSummaryService.updateNote(savedYear, noteContent);

      if (!request.isCurrent()) return;

      if (cacheKey && summaryCache.current[cacheKey]) {
        summaryCache.current[cacheKey].note = noteContent;
      }

      setSummary((prev) => {
        if (prev && prev.year === savedYear) {
          return { ...prev, note: noteContent };
        }
        return prev;
      });
    } catch (error) {
      if (request.isCurrent() && !isAbortError(error)) {
        toast.error("Erro ao salvar nota.");
      }
    } finally {
      if (request.isCurrent()) setIsSavingNote(false);
      request.finish();
    }
  };

  return {
    year,
    setYear,
    summary,
    isLoading,
    noteContent,
    setNoteContent,
    saveNote,
    isSavingNote,
    refresh: () => fetchSummary(year, true),
  };
}
