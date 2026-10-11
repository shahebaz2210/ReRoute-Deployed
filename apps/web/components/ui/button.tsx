"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "icon";
export type ButtonSize = "sm" | "default" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", isLoading = false, disabled, children, leftIcon, rightIcon, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles: Record<ButtonVariant, string> = {
      primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-xs",
      secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)]",
      outline: "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-secondary)]",
      ghost: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
      danger: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 active:opacity-95 shadow-xs",
      icon: "p-2 bg-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: variant === "icon" ? "p-1.5 text-xs" : "h-8 px-3 text-xs gap-1.5",
      default: variant === "icon" ? "p-2 text-sm" : "h-9 px-4 text-sm gap-2",
      lg: variant === "icon" ? "p-2.5 text-base" : "h-10 px-5 text-sm gap-2.5",
      xl: variant === "icon" ? "p-3 text-lg" : "h-12 px-6 text-base gap-3",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
