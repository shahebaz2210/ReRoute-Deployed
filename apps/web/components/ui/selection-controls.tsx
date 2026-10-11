"use client";

import React, { forwardRef } from "react";
import { Check } from "lucide-react";

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
          <div className="h-4 w-4 rounded border border-[var(--input)] bg-[var(--surface-input)] transition-colors peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)] peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
          <Check className="absolute h-3 w-3 text-[var(--primary-foreground)] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
        </div>
        {(label || description) && (
          <div className="flex flex-col text-sm">
            {label && <span className="font-medium text-[var(--foreground)]">{label}</span>}
            {description && <span className="text-xs text-[var(--muted-foreground)]">{description}</span>}
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
    <div className="inline-flex items-center gap-3">
      {label && (
        <label htmlFor={toggleId} className="text-sm font-medium text-[var(--foreground)] cursor-pointer">
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
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {showText && (
        <span className="text-xs font-semibold text-[var(--text-secondary)] select-none uppercase tracking-wider">
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
      {label && <legend className="text-xs font-medium text-[var(--foreground)] mb-1">{label}</legend>}
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
              <div className="h-4 w-4 rounded-full border border-[var(--input)] bg-[var(--surface-input)] transition-colors peer-checked:border-[var(--primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)] peer-focus-visible:ring-offset-2" />
              <div className="absolute h-2 w-2 rounded-full bg-[var(--primary)] opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col text-sm">
              <span className="font-medium text-[var(--foreground)]">{opt.label}</span>
              {opt.description && <span className="text-xs text-[var(--muted-foreground)]">{opt.description}</span>}
            </div>
          </label>
        );
      })}
    </fieldset>
  );
}
