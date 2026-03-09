import { CreditCard } from "@/services/cardService";
import { Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useUser } from "@/hooks/useUser";
import Image from "next/image";

export const getCardStyle = (name: string, defaultColor: string) => {
  const n = name.toLowerCase();
  if (n.includes("mercado"))
    return {
      bg: "bg-gradient-to-br from-[#009EE3] to-[#00102b]",
      text: "text-white",
    };
  if (n.includes("nubank"))
    return {
      bg: "bg-gradient-to-br from-[#820AD1] to-[#400070]",
      text: "text-white",
    };
  if (n.includes("rico"))
    return {
      bg: "bg-gradient-to-br from-[#FF7A00] to-[#FF5000]",
      text: "text-white",
    };
  if (n.includes("c6"))
    return {
      bg: "bg-gradient-to-br from-[#1a1a1a] to-[#000000]",
      text: "text-text-main",
    };
  return {
    bg: "",
    style: {
      backgroundImage: `linear-gradient(135deg, ${defaultColor} 0%, #000 100%)`,
    },
    text: "text-white",
  };
};

const CardChip = () => (
  <div className="w-10 h-7 rounded-md bg-linear-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner border border-white/20 relative overflow-hidden flex items-center justify-center opacity-90">
    <div className="absolute inset-0 border-y border-black/10 opacity-50"></div>
    <div className="absolute inset-0 border-x border-black/10 opacity-50 w-1/3 left-1/3"></div>
  </div>
);

interface CreditCardItemProps {
  card: CreditCard;
  onClick: (card: CreditCard) => void;
}

export function CreditCardItem({ card, onClick }: CreditCardItemProps) {
  const { user } = useUser();
  const styles = getCardStyle(card.name, card.color || "#333");
  const percentual = Math.min(
    (card.currentInvoiceValue / card.limit) * 100,
    100,
  );

  return (
    <motion.div
      layoutId={`card-container-${card.id}`}
      onClick={() => !user?.privacyMode && onClick(card)}
      className={`group perspective-1000 relative w-full ${user?.privacyMode ? "cursor-default" : "cursor-pointer"}`}
      whileHover={user?.privacyMode ? {} : { y: -5 }}
    >
      {/* O CARTÃO FÍSICO */}
      <motion.div
        layoutId={`card-visual-${card.id}`}
        className={`relative w-full aspect-[1.586/1] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-xl transition-shadow hover:shadow-2xl ${styles.bg}`}
        style={styles.style}
      >
        {/* Texturas */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mix-blend-overlay"></div>

        <div className="flex justify-between items-start z-10">
          <Image
            src={
              card.brand === "MASTERCARD"
                ? "https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg"
                : "https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg"
            }
            className="h-6 w-auto drop-shadow-md brightness-0 invert opacity-90"
            alt={`Logo da bandeira ${card.brand}`}
            width={40}
            height={24}
          />
          <Wifi className="w-5 h-5 text-white/50 rotate-90" />
        </div>

        <div className="flex items-center gap-4 z-10 mt-1">
          <CardChip />
        </div>

        <div className="z-10">
          <p className="font-mono text-lg tracking-[0.15em] text-white/90 drop-shadow-md">
            •••• {card.last4Digits}
          </p>
          <div className="flex justify-between items-end mt-2">
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wide">
              {card.name}
            </p>
            <p className="text-[10px] font-bold text-white/80">
              Vence dia {card.dueDay}
            </p>
          </div>
        </div>
      </motion.div>

      {/* INFO RÁPIDA */}
      <motion.div layoutId={`card-info-${card.id}`} className="mt-3 px-1">
        <div className="flex justify-between items-end mb-1.5">
          <div>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-wide">
              Fatura Atual
            </p>
            <PrivacyBlur className="text-base font-bold text-text-main">
              {card.currentInvoiceValue.toLocaleString("PT-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </PrivacyBlur>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-wide">
              Disponível
            </p>
            <PrivacyBlur className="text-xs font-medium text-emerald-500">
              {(card.limit - card.currentInvoiceValue).toLocaleString("PT-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </PrivacyBlur>
          </div>
        </div>

        {/* Barra de Limite */}
        <div className="h-1.5 w-full bg-bg-surface-hover rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentual}%` }}
            className={`h-full rounded-full ${percentual > 90 ? "bg-rose-500" : "bg-emerald-500"}`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
