"use client";

import { useHabitModals } from "@/contexts/modals/habitModalContext";
import { NewHabitModal } from "@/components/forms/newHabitModal";

export function HabitModalManager() {
  const { isNewHabitOpen, closeNewHabit } = useHabitModals();

  return <NewHabitModal isOpen={isNewHabitOpen} onClose={closeNewHabit} />;
}