"use client";

import { cn } from "@/app/lib/util";

export function Button({
  children,
  variant,
  className,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "primary" | "secondary";
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        variant === "secondary"
          ? "bg-linear-180 from-neutral-700 text-shadow-sm border-b-2 border-b-neutral-900  to-neutral-800 text-white hover:bg-neutral-700 transition-all duration-150"
          : "  border-b-neutral-500 border-b-2 text-shadow-sm bg-linear-180 from-neutral-100 to-neutral-300 hover:from-neutral-50 hover:to-neutral-100 text-neutral-900 hover:bg-neutral-100 transition-all duration-150",
        "px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
