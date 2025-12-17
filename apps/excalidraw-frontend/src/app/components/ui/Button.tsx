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
          ? "bg-neutral-700 text-white hover:bg-neutral-600 transition-all duration-150"
          : "bg-neutral-200 text-neutral-900 hover:bg-neutral-100 transition-all duration-150",
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
