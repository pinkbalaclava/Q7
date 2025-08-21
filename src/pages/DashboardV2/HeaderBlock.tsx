import * as React from "react";

// Simple cn utility function
const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export function HeaderBlock({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // left aligned container for page header
        "w-full text-left",
        // stack on small, row on md+
        "flex flex-col gap-2 md:gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}