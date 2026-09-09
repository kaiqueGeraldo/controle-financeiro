import { useState, useEffect } from "react";
import { goalService } from "@/services/goalService";
import { useGoalsContext } from "@/contexts/goalsContext";
import { GoalHistory } from "@/types";
import { useUser } from "./useUser";
import {
  isAbortError,
  useRequestCoordinator,
} from "./useRequestCoordinator";

export function useGoals() {
  const { goals, isLoading, refreshGoals } = useGoalsContext();
  const { user } = useUser();
  const requests = useRequestCoordinator(user?.id);
  
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedGoalHistory, setSelectedGoalHistory] = useState<GoalHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const metaAindaExiste = goals.find(g => g.id === selectedGoalId);

    if (selectedGoalId) {
        if (metaAindaExiste) {
            const request = requests.begin("goal-history");
            void Promise.resolve().then(() => {
              if (request.isCurrent()) setIsHistoryLoading(true);
            });
            goalService.getHistory(selectedGoalId, request.signal)
                .then(res => {
                    if (request.isCurrent()) {
                      setSelectedGoalHistory(res.data ?? []);
                    }
                })
                .catch((error: unknown) => {
                    if (request.isCurrent() && !isAbortError(error)) {
                      setSelectedGoalHistory([]);
                    }
                })
                .finally(() => {
                  if (request.isCurrent()) setIsHistoryLoading(false);
                  request.finish();
                });
        } else {
            requests.invalidate("goal-history");
            void Promise.resolve().then(() => {
              setSelectedGoalId(null);
              setSelectedGoalHistory([]);
            });
        }
    } else {
        requests.invalidate("goal-history");
        void Promise.resolve().then(() => {
          setSelectedGoalHistory([]);
          setIsHistoryLoading(false);
        });
    }

    return () => requests.invalidate("goal-history");
  }, [selectedGoalId, goals, requests]);

  return {
    goals,
    isLoading,
    refreshGoals,
    selectedGoalId,
    setSelectedGoalId,
    selectedGoal: goals.find(g => g.id === selectedGoalId),
    history: selectedGoalHistory,
    isHistoryLoading
  };
}
