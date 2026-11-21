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
        {label && <span className="text-xs font-semibold text-slate-800">{label}</span>}
        {description && <span className="text-[11px] text-slate-400 mt-0.5">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-[#0066ff]' : 'bg-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

