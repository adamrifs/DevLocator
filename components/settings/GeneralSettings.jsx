import React from 'react';
import Toggle from '../ui/Toggle.jsx';

const HIGHLIGHT_COLORS = [
  { name: 'Sky Blue', value: '#38bdf8' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
];

export default function GeneralSettings({ settings, onUpdateSettings }) {
  return (
    <div className="space-y-4">
      {/* Tooltip Toggle */}
      <Toggle
        label="Show Element Tooltip"
        description="Display tag, classes and dimensions on hover"
        checked={settings.showTooltip}
        onChange={(val) => onUpdateSettings({ showTooltip: val })}
      />

      {/* Highlight Color */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <label className="text-xs font-medium text-slate-200">
          Highlight Overlay Color
        </label>
        <div className="flex items-center gap-2">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => onUpdateSettings({ highlightColor: c.value })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                settings.highlightColor === c.value
                  ? 'border-white scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      {/* Keyboard Shortcut info */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-200">Keyboard Shortcut</span>
          <p className="text-[11px] text-slate-400">Toggle inspection without opening popup</p>
        </div>
        <kbd className="px-2 py-1 text-[11px] font-mono bg-slate-800 text-sky-300 rounded border border-slate-700 shadow-inner">
          {settings.shortcut || 'Alt+Shift+X'}
        </kbd>
      </div>
    </div>
  );
}
