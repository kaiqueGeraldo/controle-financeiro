"use client"

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  error?: string;
  classname?: string;
  onClear?: () => void;
}

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  maxLength,
  error,
  classname,
  onClear,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  return (
    <div className={`${classname ? classname : "mb-4"} relative`}>
      <label className="block text-sm mb-1 text-text-main" htmlFor={name}>
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPasswordType && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={`w-full pr-12 pl-4 py-2 rounded-md bg-[#051026] border ${
            error ? "border-red-500" : "border-[#113A8C]"
          } text-text-main placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#11468C]`}
          {...props}
        />

        {/* Botão limpar campo */}
        {onClear && value && !readOnly && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-9 -translate-y-1/2 text-text-main/60 hover:text-text-main"
            aria-label="Limpar campo"
          >
            <X size={18} />
          </button>
        )}

        {/* Botão mostrar/ocultar senha */}
        {isPasswordType && !readOnly && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-text-main/60 hover:text-text-main"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}
