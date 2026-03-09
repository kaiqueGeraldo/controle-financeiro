import { useState, useEffect, useCallback, useRef } from "react";
import { annualSummaryService } from "@/services/annualSummaryService";
import { AnnualSummaryResponse } from "@/types";
import { useUser } from "./useUser";
import { useToast } from "@/contexts/toastContext";

export function useAnnualSummary() {
  const { user, isLoading: isUserLoading } = useUser();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [summary, setSummary] = useState<AnnualSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();
  const userId = user?.id;

  // --- CACHE DE MEMÓRIA ---
  const summaryCache = useRef<Record<number, AnnualSummaryResponse>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSummary = useCallback(
    async (selectedYear: number, forceRefresh = false) => {
      if (isUserLoading || !userId) return;

      if (!forceRefresh && summaryCache.current[selectedYear]) {
        setSummary(summaryCache.current[selectedYear]);
        setNoteContent(summaryCache.current[selectedYear].note || "");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();

      timerRef.current = setTimeout(async () => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
          const res = await annualSummaryService.getSummary(
            selectedYear,
            signal,
          );
          if (!signal.aborted && res?.data) {
            setSummary(res.data);
            setNoteContent(res.data.note || "");
            summaryCache.current[selectedYear] = res.data;
          }
        } catch (error: any) {
          if (error.name !== "AbortError") {
            console.error("Erro ao buscar resumo anual:", error);
          }
        } finally {
          if (!signal.aborted) setIsLoading(false);
        }
      }, 350);
    },
    [userId, isUserLoading],
  );

  // Limpeza no unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

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

    try {
      await annualSummaryService.updateNote(savedYear, noteContent);

      if (summaryCache.current[savedYear]) {
        summaryCache.current[savedYear].note = noteContent;
      }

      setSummary((prev) => {
        if (prev && prev.year === savedYear) {
          return { ...prev, note: noteContent };
        }
        return prev;
      });
    } catch (error) {
      toast.error("Erro ao salvar nota.");
    } finally {
      setIsSavingNote(false);
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
