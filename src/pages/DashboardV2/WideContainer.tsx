import * as React from "react";

// Simple cn utility function
const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export function WideContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Desktop-first: fill most of the screen, but keep a gentle gutter
        "mx-auto w-full px-6 xl:px-8 2xl:px-10",
        // Wider than the default 7xl; tune as needed
        "max-w-[1760px] 2xl:max-w-[1920px]",
        className
      )}
      {...props}
    />
  );
}