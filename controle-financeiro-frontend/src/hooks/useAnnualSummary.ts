import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { annualSummaryService } from "@/services/annualSummaryService";
import { AnnualSummaryResponse } from "@/types";
import { useUser } from "./useUser";
import { useToast } from "@/contexts/toastContext";
import { productDateString } from "@/utils/date";
import {
  isAbortError,
  useRequestCoordinator,
} from "./useRequestCoordinator";

export function useAnnualSummary() {
  const { user, isLoading: isUserLoading } = useUser();
  const [year, setYear] = useState<number>(() => Number(productDateString(new Date()).slice(0, 4)));
  const [summary, setSummary] = useState<AnnualSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [noteContent, setNoteText] = useState("");
  const draft = useRef({ key: "", text: "", version: 0, dirty: false });
  const saving = useRef(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const toast = useToast();
  const userId = user?.id;
  const requests = useRequestCoordinator(userId);

  // --- CACHE DE MEMÓRIA ---
  const summaryCache = useRef<Record<string, AnnualSummaryResponse>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    draft.current = { key: `${userId}:${year}`, text: "", version: 0, dirty: false };
    saving.current = false;
    setIsSavingNote(false);
    setNoteText("");
    requests.invalidate("annual-note");
    requests.invalidate("annual-summary");
  }, [userId, year, requests]);

  const setNoteContent = (text: string) => {
    draft.current = { ...draft.current, text, version: draft.current.version + 1, dirty: true };
    setNoteText(text);
  };

  const receiveNote = useCallback((key: string, text: string) => {
    if (draft.current.key !== key || draft.current.dirty) return;
    draft.current.text = text;
    setNoteText(text);
  }, []);

  const fetchSummary = useCallback(
    async (selectedYear: number, forceRefresh = false) => {
      if (isUserLoading || !userId) return;
      const cacheKey = `${userId}:${selectedYear}`;
      requests.invalidate("annual-summary");
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!forceRefresh && summaryCache.current[cacheKey]) {
        setSummary(summaryCache.current[cacheKey]);
        receiveNote(cacheKey, summaryCache.current[cacheKey].note || "");
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSummary(previous => previous?.year === selectedYear ? previous : null);

      const request = requests.begin("annual-summary");

      timerRef.current = setTimeout(async () => {
        try {
          const res = await annualSummaryService.getSummary(
            selectedYear,
            request.signal,
          );
          if (request.isCurrent() && res?.data) {
            setSummary(res.data);
            receiveNote(cacheKey, res.data.note || "");
            summaryCache.current[cacheKey] = res.data;
          }
        } catch (error: unknown) {
          if (request.isCurrent() && !isAbortError(error)) {
            setError(
              error instanceof Error
                ? error
                : new Error("Falha ao carregar resumo anual."),
            );
            console.error("Erro ao buscar resumo anual:", error);
          }
        } finally {
          if (request.isCurrent()) setIsLoading(false);
          request.finish();
        }
      }, 350);
    },
    [userId, isUserLoading, requests, receiveNote],
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
    setNoteText("");
    if (isUserLoading) setIsLoading(true);
    else if (!userId) setIsLoading(false);
  }, [userId, isUserLoading]);

  useEffect(() => {
    fetchSummary(year);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requests.invalidate("annual-summary");
    };
  }, [year, fetchSummary, requests]);

  const saveNote = async (): Promise<boolean> => {
    if (!userId || !summary || saving.current) return false;
    const submitted = { ...draft.current };
    if (summary.note === submitted.text) {
      draft.current.dirty = false;
      return true;
    }

    saving.current = true;
    setIsSavingNote(true);
    const savedYear = year;
    const request = requests.begin("annual-note");
    requests.invalidate("annual-summary");
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoading(false);
    const cacheKey = userId ? `${userId}:${savedYear}` : null;
    // A completed write may outlive this screen/year. Never reuse its old note.
    if (cacheKey) delete summaryCache.current[cacheKey];

    try {
      await annualSummaryService.updateNote(savedYear, submitted.text);

      if (!request.isCurrent()) return false;
      requests.invalidate("annual-summary");
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsLoading(false);

      if (cacheKey && summaryCache.current[cacheKey]) {
        summaryCache.current[cacheKey] = { ...summaryCache.current[cacheKey], note: submitted.text };
      }

      setSummary((prev) => {
        if (prev && prev.year === savedYear) {
          return { ...prev, note: submitted.text };
        }
        return prev;
      });
      const unchanged = draft.current.key === submitted.key && draft.current.version === submitted.version;
      if (unchanged) draft.current.dirty = false;
      return unchanged;
    } catch (error) {
      if (request.isCurrent() && !isAbortError(error)) {
        toast.error("Erro ao salvar nota.");
      }
      return false;
    } finally {
      if (request.isCurrent()) {
        saving.current = false;
        setIsSavingNote(false);
      }
      request.finish();
    }
  };

  return {
    year,
    setYear,
    summary,
    isLoading,
    error,
    noteContent,
    setNoteContent,
    saveNote,
    isSavingNote,
    refresh: () => fetchSummary(year, true),
  };
}
