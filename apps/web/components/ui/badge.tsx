import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D3139] focus:ring-offset-2 tracking-tight",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#2D3139] text-white hover:bg-[#3D434E] shadow-2xs",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200",
        destructive:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
        outline:
          "text-neutral-800 border-neutral-200 bg-white/70 dark:text-neutral-200 dark:border-neutral-800 dark:bg-neutral-900",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
