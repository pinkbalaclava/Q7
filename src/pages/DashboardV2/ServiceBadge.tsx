import * as React from "react";
import { cn } from "@/lib/utils";
import type { Service } from "./types";

const MAP: Record<Service, string> = {
  VAT:       "bg-blue-100 text-blue-800 border-blue-200",
  ACCOUNTS:  "bg-emerald-100 text-emerald-800 border-emerald-200",
  SA:        "bg-violet-100 text-violet-800 border-violet-200",
};

export function ServiceBadge({ service, className }: { service: Service; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs rounded-full border font-medium",
        MAP[service],
        className
      )}
    >
      {service}
    </span>
  );
}