import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  autoComplete?: string;
  required?: boolean;
  togglePassword?: boolean;
}

export default function AuthInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  autoComplete,
  required = false,
  togglePassword = false,
}: AuthInputProps) {
  const [show, setShow] = useState(false);
  const inputType = type === 'password' && togglePassword ? (show ? 'text' : 'password') : type;
  return (
    <div className="space-y-2.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="group relative">
        <input
          id={name}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 py-3.5 pl-11 ${
            togglePassword ? 'pr-12' : 'pr-4'
          } text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400 focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 group-hover:border-slate-600`}
        />
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 transition-colors duration-200 group-focus-within:text-cyan-400 group-hover:text-slate-300">
            <Icon size={18} />
          </div>
        )}
        {type === 'password' && togglePassword && (
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-transparent p-1 text-slate-400 transition hover:text-cyan-300 focus:outline-none"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
