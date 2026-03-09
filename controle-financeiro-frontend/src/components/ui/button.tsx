import clsx from "clsx";
import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  bg?: string;
  hoverBg?: string;
  textColor?: string;
  hoverTextColor?: string;
}

export default function Button({
  isLoading = false,
  bg = "bg-[#113A8C]",
  hoverBg = "hover:bg-[#0B2559]",
  textColor = "text-text-main",
  hoverTextColor = "",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={isLoading || props.disabled}
      className={clsx(
        "py-2 px-4 rounded-md transition duration-200 font-medium flex justify-center items-center",
        bg,
        hoverBg,
        textColor,
        hoverTextColor,
        {
          "bg-gray-400 cursor-not-allowed": isLoading || props.disabled,
          "cursor-pointer": !isLoading && !props.disabled,
        },
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin h-5 w-5" />
      ) : (
        children
      )}
    </button>
  );
}
