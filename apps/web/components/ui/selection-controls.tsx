"use client";

import React, { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, description, id, checked, ...props }, ref) => {
    const checkId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label htmlFor={checkId} className="inline-flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkId}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded-md border border-neutral-300 bg-white transition-colors peer-checked:bg-[#2D3139] peer-checked:border-[#2D3139] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2D3139] peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:peer-checked:bg-neutral-100 dark:peer-checked:border-neutral-100" />
          <Check className="absolute h-3 w-3 text-white dark:text-neutral-900 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[2.5]" />
        </div>
        {(label || description) && (
          <div className="flex flex-col text-xs md:text-sm">
            {label && <span className="font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">{label}</span>}
            {description && <span className="text-xs text-neutral-500 leading-relaxed">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export interface ToggleProps {
  id?: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showText?: boolean;
}

export function Toggle({ id, label, checked, onChange, disabled = false, showText = true }: ToggleProps) {
  const toggleId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : "toggle-switch");

  return (
    <div className="inline-flex items-center gap-2.5">
      {label && (
        <label htmlFor={toggleId} className="text-xs md:text-sm font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer tracking-tight">
          {label}
        </label>
      )}
      <button
        type="button"
        id={toggleId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-[#2D3139] dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-800"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out dark:bg-neutral-900",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
      {showText && (
        <span className="text-[11px] font-semibold text-neutral-500 select-none uppercase tracking-wider">
          {checked ? "On" : "Off"}
        </span>
      )}
    </div>
  );
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export function RadioGroup({ name, options, value, onChange, label }: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      {label && <legend className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">{label}</legend>}
      {options.map((opt) => {
        const optId = `${name}-${opt.value}`;
        const isSelected = value === opt.value;
        return (
          <label key={opt.value} htmlFor={optId} className="inline-flex items-start gap-2.5 cursor-pointer select-none">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="radio"
                id={optId}
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="peer sr-only"
              />
              <div className="h-4 w-4 rounded-full border border-neutral-300 bg-white transition-colors peer-checked:border-[#2D3139] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2D3139] peer-focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:peer-checked:border-neutral-100" />
              <div className="absolute h-2 w-2 rounded-full bg-[#2D3139] dark:bg-neutral-100 opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col text-xs md:text-sm">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">{opt.label}</span>
              {opt.description && <span className="text-xs text-neutral-500">{opt.description}</span>}
            </div>
          </label>
        );
      })}
    </fieldset>
  );
}
