import React, { useState, type ReactNode } from "react";

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

// Contexto simples pra comunicar Trigger/Content
const TabsContext = React.createContext<{
  active: string;
  setActive: (val: string) => void;
} | null>(null);

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  const setActive = (val: string) => {
    setInternalValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ active: internalValue, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={`flex border-b border-gray-200 mb-4 ${className || ""}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger deve estar dentro de <Tabs>");

  const ativo = ctx.active === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setActive(value)}
      className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
        ativo
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      } ${className || ""}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent deve estar dentro de <Tabs>");

  if (ctx.active !== value) return null;

  return <div className={className}>{children}</div>;
}
