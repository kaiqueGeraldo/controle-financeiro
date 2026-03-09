import React from "react";

interface UserCardProps {
  nome: string;
  email: string;
  onClick?: () => void;
  onLogout?: () => void;
  showLogoutButton?: boolean;
  isActive?: boolean;
  onRemoveVinculo?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  nome,
  email,
  onClick,
  onLogout,
  showLogoutButton = true,
  isActive = false,
  onRemoveVinculo,
}) => {
  const primeiraLetra = nome?.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center justify-between gap-5 cursor-pointer p-2 rounded-lg transition select-none
        ${
          isActive
            ? "border border-blue-400 bg-[#1A2F57] mb-6"
            : "hover:bg-[#1A2747] mt-2"
        }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-[#1A2747] font-bold text-xl">
          {primeiraLetra || "?"}
        </div>
        <div className="flex flex-col items-start">
          <h2 className="text-text-main text-lg font-bold">
            {nome || "Carregando..."}
          </h2>
          <span className="text-gray-400 text-sm">{email || ""}</span>
        </div>
      </div>

      {onRemoveVinculo ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveVinculo();
          }}
          className="flex w-1/4 h-10 items-center justify-center bg-gray-700 hover:bg-gray-600 text-text-main rounded transition duration-200 cursor-pointer"
        >
          Remover
        </button>
      ) : (
        showLogoutButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout?.();
            }}
            className="flex w-1/4 h-10 items-center justify-center bg-red-700 hover:bg-red-600 text-text-main rounded transition duration-200 cursor-pointer"
          >
            Sair
          </button>
        )
      )}
    </div>
  );
};
