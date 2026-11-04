import React from 'react';

/**
 * Reusable Toggle switch component.
 */
export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1 select-none">
      <div className="flex flex-col pr-3">
        {label && <span className="text-xs font-medium text-slate-200">{label}</span>}
        {description && <span className="text-[11px] text-slate-400">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          checked ? 'bg-sky-500' : 'bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}
