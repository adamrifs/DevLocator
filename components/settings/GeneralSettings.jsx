import React from 'react';
import { Moon, Sun, Keyboard } from 'lucide-react';
import Toggle from '../ui/Toggle.jsx';

const HIGHLIGHT_COLORS = [
  { name: 'Sky Blue', value: '#38bdf8' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
];

export default function GeneralSettings({ settings, onUpdateSettings }) {
  const currentTheme = settings.theme || 'light';

  return (
    <div className="space-y-4">
      {/* Theme Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-800">
          Interface Theme
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
              currentTheme === 'light'
                ? 'bg-[#edf5ff] border-blue-200 text-[#0066ff] shadow-xs'
                : 'bg-white border-slate-200/70 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light Theme</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
              currentTheme === 'dark'
                ? 'bg-[#edf5ff] border-blue-200 text-[#0066ff] shadow-xs'
                : 'bg-white border-slate-200/70 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-slate-700" />
            <span>Dark Theme</span>
          </button>
        </div>
      </div>

      {/* Hold Shift Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <Toggle
          label="Hold Shift to Inspect"
          description="Press and hold Shift on any webpage to inspect elements under the cursor"
          checked={settings.activationMode !== 'manual'}
          onChange={(enabled) =>
            onUpdateSettings({
              activationMode: enabled ? 'hold_shift' : 'manual',
              shortcut: enabled ? 'Hold Shift' : 'Alt+Shift+X',
            })
          }
        />
      </div>

      {/* Tooltip Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <Toggle
          label="Show Element Tooltip"
          description="Display tag, classes and dimensions on hover"
          checked={settings.showTooltip}
          onChange={(val) => onUpdateSettings({ showTooltip: val })}
        />
      </div>

      {/* Highlight Color & Opacity */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800">
            Highlight Overlay Color
          </label>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shadow-xs"
              style={{ backgroundColor: settings.highlightColor || '#0066ff' }}
            />
            <input
              type="text"
              value={settings.highlightColor || '#0066ff'}
              onChange={(e) => onUpdateSettings({ highlightColor: e.target.value })}
              className="w-20 px-1.5 py-0.5 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center uppercase"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => onUpdateSettings({ highlightColor: c.value })}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                settings.highlightColor === c.value
                  ? 'border-[#0066ff] scale-110 shadow-sm'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Fill Opacity Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Overlay Fill Opacity</span>
            <span className="font-mono text-[#0066ff] font-bold">
              {Math.round((settings.fillOpacity ?? 0.15) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.45"
            step="0.05"
            value={settings.fillOpacity ?? 0.15}
            onChange={(e) => onUpdateSettings({ fillOpacity: parseFloat(e.target.value) })}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066ff]"
          />
        </div>
      </div>
    </div>
  );
}
