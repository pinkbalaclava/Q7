import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  // visual variant for white background (soft tint + border + text color)
  variant?: "blue"|"green"|"purple"|"indigo"|"sky"|"amber"|"emerald"|"emeraldDark"|"slate";
};

const PALETTE: Record<NonNullable<Props["variant"]>, string> = {
  blue:        "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
  green:       "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
  purple:      "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
  indigo:      "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100",
  sky:         "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100",
  amber:       "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
  emerald:     "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
  emeraldDark: "bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200",
  slate:       "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
};

export function ActionTile({ label, icon, onClick, disabled, variant = "slate" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 transition-colors",
        "shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed",
        PALETTE[variant]
      )}
      aria-label={label}
      title={label}
    >
      <span className="grid place-items-center h-9 w-9 rounded-full bg-white/70 border border-white/50">
        {icon}
      </span>
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </button>
  );
}