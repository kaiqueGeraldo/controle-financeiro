"use client";

import { NewHabitModal } from "@/components/forms/newHabitModal";
import { useHabitModals } from "@/contexts/modals/habitModalContext";

export function HabitModalManager() {
  const { isNewHabitOpen, closeNewHabit } = useHabitModals();

  return <NewHabitModal isOpen={isNewHabitOpen} onClose={closeNewHabit} />;
}