import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useUser } from "@/hooks/useUser";
import { Goal, GoalType } from "@/types";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Car,
  Droplets,
  Home,
  Laptop,
  Plane,
  ShieldAlert,
  Target,
  Trophy,
} from "lucide-react";

// --- HELPERS VISUAIS ---

export const getGoalIcon = (iconName?: string) => {
  switch (iconName) {
    case "ShieldAlert":
      return <ShieldAlert size={20} />;
    case "BookOpen":
      return <BookOpen size={20} />;
    case "Droplets":
      return <Droplets size={20} />;
    case "Laptop":
      return <Laptop size={20} />;
    case "Car":
      return <Car size={20} />;
    case "Home":
      return <Home size={20} />;
    case "Plane":
      return <Plane size={20} />;
    case "Trophy":
      return <Trophy size={20} />;
    default:
      return <Target size={20} />;
  }
};

export const getGoalColorClass = (color?: string) => {
  switch (color) {
    case "EMERALD":
      return "text-emerald-400 bg-emerald-400/10 from-emerald-500 to-emerald-300";
    case "BLUE":
      return "text-blue-400 bg-blue-400/10 from-blue-500 to-blue-300";
    case "CYAN":
      return "text-cyan-400 bg-cyan-400/10 from-cyan-500 to-cyan-300";
    case "PURPLE":
      return "text-purple-400 bg-purple-400/10 from-purple-500 to-purple-300";
    case "ROSE":
      return "text-rose-400 bg-rose-400/10 from-rose-500 to-rose-300";
    case "AMBER":
      return "text-amber-400 bg-amber-400/10 from-amber-500 to-amber-300";
    default:
      return "text-emerald-400 bg-emerald-400/10 from-emerald-500 to-emerald-300";
  }
};

export const formatarValorMeta = (
  valor: number,
  tipo: GoalType,
  unidade?: string,
) => {
  if (tipo === "MONETARY") {
    return formatCurrency(valor);
  }
  return `${valor} ${unidade || ""}`;
};

export const ProgressBar = ({
  atual,
  total,
  gradiente,
  layoutId,
}: {
  atual: number;
  total: number;
  gradiente: string;
  layoutId?: string;
}) => {
  const percentual = total > 0 ? Math.min((atual / total) * 100, 100) : 0;
  const bgClasses = gradiente.includes("from-")
    ? gradiente
        .split(" ")
        .filter(
          (c) =>
            c.startsWith("from-") ||
            c.startsWith("to-") ||
            c.startsWith("bg-gradient"),
        )
        .join(" ")
    : "bg-emerald-500";

  return (
    <div className="h-3 w-full bg-bg-surface-hover rounded-full overflow-hidden">
      <motion.div
        layoutId={layoutId}
        initial={{ width: 0 }}
        animate={{ width: `${percentual}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full bg-linear-to-r ${bgClasses} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
      />
    </div>
  );
};

export const StatusBadge = ({ goal }: { goal: Goal }) => {
  const percent = goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 0;
  const isComplete = percent >= 1;
  const isLate = new Date(goal.deadline) < new Date() && !isComplete;

  let style = {
    text: "No Foco",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  };

  if (isComplete)
    style = {
      text: "Concluído",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    };
  else if (isLate)
    style = {
      text: "Atrasado",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    };
  else if (percent < 0.2)
    style = {
      text: "Iniciando",
      color: "text-text-muted bg-zinc-500/10 border-zinc-500/20",
    };

  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.color}`}
    >
      {style.text}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface GoalItemProps {
  goal: Goal;
  onClick: (id: string) => void;
  layoutIdPrefix?: string;
}

export function GoalItem({ goal, onClick, layoutIdPrefix = "goals" }: GoalItemProps) {
  const { user } = useUser();
  const percentual = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const isConcluido = percentual >= 100;
  const colorClass = getGoalColorClass(goal.color);
  const [textColor, bgColor] = colorClass.split(" ");

  return (
    <div className="relative">
      <motion.div 
        layoutId={`${layoutIdPrefix}-card-container-${goal.id}`}
        onClick={() => !user?.privacyMode && onClick(goal.id)}
        className={`
          bg-bg-surface border border-border-divider rounded-2xl p-5 
          group relative overflow-hidden h-full flex flex-col justify-between
          ${isConcluido ? 'border-emerald-500/30' : ''}
          ${user?.privacyMode ? 'cursor-default' : 'cursor-pointer hover:border-border-divider'}
        `}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <motion.div
              layoutId={`${layoutIdPrefix}-icon-${goal.id}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${textColor} ${bgColor}`}
            >
              {getGoalIcon(goal.icon)}
            </motion.div>
            <div>
              <motion.h3
                layoutId={`${layoutIdPrefix}-title-${goal.id}`}
                className="font-bold text-lg text-text-main group-hover:text-emerald-400 transition-colors"
              >
                {goal.title}
              </motion.h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge goal={goal} />
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Calendar size={12} />{" "}
                  {new Date(goal.deadline).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
            <div className="flex justify-between items-end mb-2">
              <PrivacyBlur className="text-2xl font-bold text-text-main">
                {formatarValorMeta(goal.currentValue, goal.type, goal.unit)}
              </PrivacyBlur>
              <PrivacyBlur className="text-xs text-text-muted mb-1">
                {percentual.toFixed(0)}%
              </PrivacyBlur>
            </div>
                  
            <ProgressBar
              atual={goal.currentValue}
              total={goal.targetValue}
              gradiente={colorClass}
              layoutId={`${layoutIdPrefix}-progress-${goal.id}`}
            />
        </div>
      </motion.div>
    </div>
  );
}
