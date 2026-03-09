import {
  CalendarDays,
  Coins,
  CreditCard,
  History,
  Landmark,
  LayoutDashboard,
  ListTodo,
  ScrollText,
  Target
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNavLinks() {
  const pathname = usePathname();

  const menuItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      text: "Dashboard",
      link: "/",
    },
    {
      icon: <Landmark className="w-5 h-5" />,
      text: "Minhas Contas",
      link: "/contas",
    },
    {
      icon: <ScrollText className="w-5 h-5" />,
      text: "Extrato",
      link: "/extrato",
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      text: "Cartões de Crédito",
      link: "/cartoes",
    },
    {
      icon: <CalendarDays className="w-5 h-5" />,
      text: "Planejamento",
      link: "/planejamento",
    },
    {
      icon: <Target className="w-5 h-5" />,
      text: "Metas",
      link: "/metas",
    },
    {
      icon: <Coins className="w-5 h-5" />,
      text: "Investimentos",
      link: "/investimentos",
    },
    {
      icon: <History className="w-5 h-5" />,
      text: "Resumo Anual",
      link: "/resumo-anual",
    },
    {
      icon: <ListTodo className="w-5 h-5" />,
      text: "Hábitos",
      link: "/habitos",
    },
  ];

  return (
    <nav className="space-y-2 mt-6 px-4">
      {menuItems.map((item, index) => {
        const isActive = pathname === item.link;
        return (
          <Link
            key={index}
            href={item.link}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive
                ? "bg-bg-surface-hover text-emerald-400 font-medium shadow-lg shadow-black/20"
                : "text-text-muted hover:bg-bg-surface-hover/50 hover:text-text-main"
            }`}
          >
            <div
              className={`${isActive ? "text-emerald-400" : "text-text-muted group-hover:text-text-main"}`}
            >
              {item.icon}
            </div>
            <span>{item.text}</span>
          </Link>
        );
      })}
    </nav>
  );
}
