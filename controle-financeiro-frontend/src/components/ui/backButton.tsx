import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  disabled?: boolean;
}

export default function BackButton({ disabled }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      className="flex items-center text-text-main cursor-pointer"
      disabled={disabled}
      onClick={() => !disabled && router.back()}
    >
      <ArrowLeft width={20} height={20} />
    </button>
  );
}
