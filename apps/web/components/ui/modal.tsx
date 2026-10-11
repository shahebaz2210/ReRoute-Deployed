"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3139]/30 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "w-full rounded-2xl border border-neutral-200/80 bg-white shadow-2xl p-6 flex flex-col gap-4 focus:outline-none text-[#272A30]",
          sizeClasses[size]
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h3 id="modal-title" className="text-base md:text-lg font-semibold tracking-tight text-[#272A30]">
                {title}
              </h3>
            )}
            {description && (
              <p id="modal-description" className="text-xs text-neutral-500 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-[#272A30] hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-xs md:text-sm text-neutral-700 leading-relaxed max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
