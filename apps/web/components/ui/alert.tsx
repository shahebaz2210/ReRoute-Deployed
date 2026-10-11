"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-white text-[#18181B] border-neutral-200/90 shadow-xs",
        info: "bg-white text-[#18181B] border-neutral-200/90 [&>svg]:text-neutral-700 shadow-xs",
        destructive:
          "border-red-200 bg-white text-[#18181B] [&>svg]:text-red-600 shadow-xs",
        warning:
          "border-amber-200 bg-white text-[#18181B] [&>svg]:text-amber-600 shadow-xs",
        success:
          "border-emerald-200 bg-white text-[#18181B] [&>svg]:text-emerald-600 shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type AlertVariant = "default" | "info" | "destructive" | "warning" | "success";

const iconMap = {
  default: Info,
  info: Info,
  destructive: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, description, children, onClose, ...props }, ref) => {
    const Icon = iconMap[variant || "info"] || Info;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <div className="flex-1 pr-6">
          {title && <h5 className="mb-1 font-semibold leading-none tracking-tight">{title}</h5>}
          {description && <div className="text-xs leading-relaxed opacity-90">{description}</div>}
          {children}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs [&_p]:leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
