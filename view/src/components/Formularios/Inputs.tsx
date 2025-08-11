import React from 'react';
import Select from "react-select";

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
  placeholder?: string
}

export const Input = ({
  label,
  name,
  value,
  onChange,
  required = true,
  type = 'text',
  min = 0,
  maxLength,
  disable = false,
  placeholder = ""
}: InputProps) => (
  <div className="w-full">
    <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-900">
      {label}{required && ' *'}
    </label>
    <input
      type={name === 'senha' ? 'password' : type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      min={min}
      maxLength={maxLength}
      disabled={disable}
      placeholder={placeholder}
      className="border border-gray-300 text-gray-900 text-sm rounded-md focus:border-2 focus:border-blue-500 focus:outline-none block w-full p-2.5 bg-white"
    />
  </div>
);

// Select
export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
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