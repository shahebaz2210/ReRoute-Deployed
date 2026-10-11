import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = (val: string) => {
    if (onValueChange) onValueChange(val);
    else setInternalValue(val);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-9.5 items-center justify-center rounded-xl bg-neutral-100 p-1 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(TabsContext);
  const isSelected = context?.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => context?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1 text-xs font-semibold ring-offset-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-white text-[#272A30] shadow-2xs dark:bg-neutral-800 dark:text-neutral-50"
          : "hover:text-[#272A30] text-neutral-500 dark:hover:text-neutral-100 dark:text-neutral-400",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-3 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
