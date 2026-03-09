import { motion } from "framer-motion";
import { Check, Flame, Zap } from "lucide-react";
import { Habit } from "@/types";
import { getGoalIcon, getGoalColorClass } from "../goals/goalItem";
import { useUser } from "@/hooks/useUser";
import { PrivacyBlur } from "@/components/ui/privacyBlur";

interface HabitItemProps {
  habit: Habit;
  onToggle: (id: string, date: string) => void;
  onClick: (habit: Habit) => void;
  layoutIdPrefix?: string;
}

const normalizeDate = (d: any) =>
  Array.isArray(d)
    ? `${d[0]}-${String(d[1]).padStart(2, "0")}-${String(d[2]).padStart(2, "0")}`
    : d;

const getWeekBoundaries = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + distToMonday,
  );
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
};

export function HabitItem({
  habit,
  onToggle,
  onClick,
  layoutIdPrefix = "habits",
}: HabitItemProps) {
  const { user } = useUser();
  const colorClass = getGoalColorClass(habit.color);
  const [textColor, bgColor] = colorClass.split(" ");
  const dObj = new Date();
  const today = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`;

  const isCompletedToday = habit.logs?.some(
    (l) => normalizeDate(l.date) === today && l.status === "COMPLETED",
  );

  let completedThisWeek = 0;
  if (habit.frequency === "WEEKLY_GOAL") {
    const { monday, sunday } = getWeekBoundaries();
    completedThisWeek = (habit.logs || []).filter((l) => {
      if (l.status !== "COMPLETED") return false;
      const logDate = new Date(normalizeDate(l.date) + "T12:00:00");
      return logDate >= monday && logDate <= sunday;
    }).length;
  }

  return (
    <motion.div
      layoutId={`${layoutIdPrefix}-habit-card-${habit.id}`}
      role={user?.privacyMode ? "presentation" : "button"}
      tabIndex={user?.privacyMode ? -1 : 0}
      aria-label={`Ver detalhes do hábito ${habit.name}`}
      onClick={() => !user?.privacyMode && onClick(habit)}
      onKeyDown={(e) => {
        if (!user?.privacyMode && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(habit);
        }
      }}
      className={`bg-bg-surface border border-border-divider rounded-2xl p-5 flex flex-col justify-between transition-colors h-full min-h-40 ${user?.privacyMode ? "cursor-default" : "cursor-pointer hover:border-border-divider shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-bg-base"}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-3 items-center min-w-0">
          <motion.div
            layoutId={`${layoutIdPrefix}-icon-${habit.id}`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${textColor} ${bgColor}`}
          >
            {getGoalIcon(habit.icon)}
          </motion.div>
          <div className="min-w-0 pr-2">
            <motion.h3
              layoutId={`${layoutIdPrefix}-title-${habit.id}`}
              className="font-bold text-base text-text-main truncate"
            >
              {habit.name}
            </motion.h3>

            {habit.frequency === "WEEKLY_GOAL" ? (
              <span className="text-[10px] text-text-muted font-bold uppercase flex items-center gap-1 tracking-wider mt-0.5">
                <Zap size={12} className="text-blue-500" />
                <PrivacyBlur>
                  {completedThisWeek}/{habit.weeklyGoal}
                </PrivacyBlur>{" "}
                esta semana
              </span>
            ) : (
              <span className="text-[10px] text-text-muted font-bold uppercase flex items-center gap-1 tracking-wider mt-0.5">
                <Flame size={12} className="text-orange-500" />{" "}
                <PrivacyBlur>{habit.currentStreak}</PrivacyBlur> dias seguidos
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          !user?.privacyMode && onToggle(habit.id, today);
        }}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
          user?.privacyMode
            ? "bg-bg-surface-hover border border-border-divider text-text-muted cursor-default"
            : isCompletedToday
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
              : "bg-bg-surface-hover border border-border-divider text-text-main hover:bg-emerald-600 hover:text-white hover:border-emerald-500 cursor-pointer"
        }`}
      >
        <PrivacyBlur className="flex items-center justify-center gap-2">
          {isCompletedToday ? (
            <>
              <Check size={18} /> Feito Hoje
            </>
          ) : (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-current opacity-70" />{" "}
              {habit.frequency === "WEEKLY_GOAL"
                ? "Avançar Progresso"
                : "Marcar Feito"}
            </>
          )}
        </PrivacyBlur>
      </button>
    </motion.div>
  );
}
