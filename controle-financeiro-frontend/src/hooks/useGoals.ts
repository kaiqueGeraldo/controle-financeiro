import { useState, useEffect } from "react";
import { goalService } from "@/services/goalService";
import { useGoalsContext } from "@/contexts/goalsContext";
import { GoalHistory } from "@/types";

export function useGoals() {
  const { goals, isLoading, refreshGoals } = useGoalsContext();
  
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedGoalHistory, setSelectedGoalHistory] = useState<GoalHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const metaAindaExiste = goals.find(g => g.id === selectedGoalId);

    if (selectedGoalId) {
        if (metaAindaExiste) {
            setIsHistoryLoading(true);
            goalService.getHistory(selectedGoalId)
                .then(res => {
                    if (res?.data) setSelectedGoalHistory(res.data);
                })
                .catch(() => {
                    setSelectedGoalHistory([]); 
                })
                .finally(() => setIsHistoryLoading(false));
        } else {
            setSelectedGoalId(null);
            setSelectedGoalHistory([]);
        }
    } else {
        setSelectedGoalHistory([]);
    }
  }, [selectedGoalId, goals]); 

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