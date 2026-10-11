"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-xl text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer tracking-tight",
  {
    variants: {
      variant: {
        default:
          "bg-[#2D3139] text-white hover:bg-[#3D434E] dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white shadow-xs active:scale-[0.99]",
        primary:
          "bg-[#2D3139] text-white hover:bg-[#3D434E] dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white shadow-xs active:scale-[0.99]",
        secondary:
          "bg-neutral-100 text-[#272A30] hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700",
        outline:
          "border border-neutral-200/90 bg-white text-[#272A30] hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 shadow-2xs",
        ghost:
          "bg-transparent text-neutral-600 hover:text-[#272A30] hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-xs active:scale-[0.99]",
        icon:
          "p-2 bg-transparent text-neutral-600 hover:text-[#272A30] hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 rounded-xl",
      },
      size: {
        default: "h-9.5 px-4 text-xs gap-2",
        sm: "h-8.5 px-3.5 text-xs gap-1.5",
        lg: "h-11 px-5 text-sm gap-2.5",
        xl: "h-12.5 px-6 text-base gap-3",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "icon" | "default";
export type ButtonSize = "sm" | "default" | "lg" | "xl" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, disabled, children, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
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
