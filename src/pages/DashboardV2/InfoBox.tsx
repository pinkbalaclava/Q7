import * as React from "react";
import { cn } from "@/lib/utils";

export function InfoBox({
  label,
  value,
  className,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("border rounded-md p-3", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value ?? children ?? "—"}</div>
    </div>
  );
}