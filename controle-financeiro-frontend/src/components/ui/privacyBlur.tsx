"use client";

import { useUser } from "@/hooks/useUser";

interface PrivacyBlurProps {
  children: React.ReactNode;
  className?: string;
}

export function PrivacyBlur({ children, className = "" }: PrivacyBlurProps) {
  const { user } = useUser();

  return (
    <span 
      className={`transition-all duration-300 flex ${className} ${
        user?.privacyMode 
          ? "text-transparent! bg-bg-blur-hover! bg-none! border-transparent! rounded-md select-none pointer-events-none px-2 animate-pulse" 
          : ""
      }`}
    >
      {children}
    </span>
  );
}