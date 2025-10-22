import React, { useEffect, useMemo, useRef, useState } from 'react';
import Select from "react-select";
import { normalizeStr } from '../../auxiliares/utils';
import { Eye, EyeOff } from 'lucide-react'

// Input
interface InputProps {
  label?: string;
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  min?: number;
  maxLength?: number;
  disable?: boolean;
  placeholder?: string;
}

export const Input = ({
  label,
  name,
  value,
  onChange,
  required = true,
  type = "text",
  min = 0,
  maxLength,
  disable = false,
  placeholder = "",
}: InputProps) => {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full relative">
      {label && (
        <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-900">
          {label}
          {required && " *"}
        </label>
      )}

      <input
        type={isPassword && !mostrarSenha ? "password" : "text"}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        maxLength={maxLength}
        disabled={disable}
        placeholder={placeholder}
        className="border border-gray-300 text-gray-900 text-sm rounded-md focus:border-2 focus:border-blue-500 focus:outline-none block w-full p-2.5 bg-white disabled:opacity-50 pr-12"
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setMostrarSenha((prev) => !prev)}
          className="absolute right-3 top-9 text-sm text-blue-600 hover:underline cursor-pointer"
        >
          {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
};

// Select
export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  placeholder?: string;
  disable?: boolean;
}

export const SelectInput = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
  placeholder = 'Selecione uma opção',
  disable = false
}: SelectInputProps) => (
  <div className="w-full">
    {label && (
      <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-900">
        {label}{required && ' *'}
      </label>
    )}
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disable}
      className={`border border-gray-300 text-sm rounded-md block w-full p-2.5 focus:border-2 focus:border-blue-500 focus:outline-none bg-white`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Multiple Select
export interface SelectMultipleOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface SelectMultiInputProps<T extends string | number = number> {
  label: string;
  name: string;
  value: T[];
  onChange: (values: T[]) => void;
  options: SelectMultipleOption<T>[];
  required?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
}

export const SelectMultiInput = <T extends string | number>({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
  placeholder = "Selecione...",
  isDisabled = false,
}: SelectMultiInputProps<T>) => {
  const selected = options.filter((opt) => value.includes(opt.value));

  return (
    <div className="w-full">
      <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-900">
        {label}
        {required && " *"}
      </label>
      <Select
        inputId={name}
        isMulti
        options={options}
        value={selected}
        onChange={(selected) => onChange(selected.map((s) => s.value))}
        isDisabled={isDisabled}
        placeholder={placeholder}
        className="text-sm"
        classNamePrefix="select"
      />
    </div>
  );
};

// Text Area
interface TextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}

export const TextArea = ({
  label,
  name,
  value,
  onChange,
  required = true,
  rows = 4,
  maxLength,
  placeholder = "",
}: TextAreaProps) => (
  <div className="w-full">
    <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-900">
      {label}{required && ' *'}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      className="border border-gray-300 text-gray-900 text-sm rounded-md focus:border-2 focus:border-blue-500 focus:outline-none block w-full p-2.5 resize-none bg-white"
    />
  </div>
);

// CheckBox
interface CheckboxStatusProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function CheckboxStatus({ checked, onChange, disabled = false }: CheckboxStatusProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-200 rounded-md focus:ring-yellow-500 focus:ring-2 disabled:opacity-50 cursor-pointer"
    />
  );
}


// SelectSearch
type Option = { label: string; value: string | number };

interface Props {
  label?: string;
  name?: string;
  options: Option[];
  value: string | number | "";
  onChange: (v: string | number | "") => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  allowClear?: boolean;
  emptyOptionLabel?: string;
}

export function SearchableSelect({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Pesquisar...",
  disabled,
  loading,
  className = "",
  allowClear = true,
  emptyOptionLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // inclui a opção vazia no topo, se pedida
  const baseOptions = useMemo<Option[]>(() => {
    return emptyOptionLabel != null
      ? [{ label: emptyOptionLabel, value: "" }, ...options]
      : options;
  }, [options, emptyOptionLabel]);

  // filtra por label (e value stringificado), case-insensitive
  const filtered = useMemo(() => {
    const q = normalizeStr(query.trim());
    if (!q) return baseOptions;

    return baseOptions.filter(o =>
      normalizeStr(o.label).includes(q) ||
      normalizeStr(String(o.value)).includes(q)
    );
  }, [baseOptions, query]);

  const selectedLabel =
    baseOptions.find(o => o.value === value)?.label ?? "";

  // clique fora fecha
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // quando abrir, foca o input e prepara highlight
  useEffect(() => {
    if (open) {
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const selectAt = (idx: number) => {
    const item = filtered[idx];
    if (!item) return;
    onChange(item.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectAt(highlight);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className={`w-full ${className}`} ref={wrapRef}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          name={name}
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          onKeyDown={onKeyDown}
          className={`w-full text-left bg-white border border-gray-300 rounded-md px-3 py-2 pr-10
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-60`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
            {selectedLabel || "Selecione"}
          </span>
        </button>

        {/* botão limpar */}
        {allowClear && (value !== "" && value !== undefined) && !disabled && (
          <button
            type="button"
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            aria-label="Limpar seleção"
            title="Limpar"
          >
            ×
          </button>
        )}

        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          aria-hidden
        >
          ▾
        </span>

        {open && (
          <div
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg"
            role="listbox"
          >
            <div className="p-2">
              <input
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-56 overflow-auto py-1">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Carregando…</div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">Nenhuma opção</div>
              ) : (
                filtered.map((o, idx) => {
                  const active = idx === highlight;
                  const selected = o.value === value;
                  return (
                    <div
                      key={`${o.value}`}
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setHighlight(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectAt(idx);
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm
                        ${active ? "bg-blue-50" : ""}
                        ${selected ? "font-medium" : ""}`}
                    >
                      {o.label}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}