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
  const currentTheme = settings.theme || 'dark';

  return (
    <div className="space-y-4">
      {/* Theme Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-200">
          Interface Theme
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
              currentTheme === 'dark'
                ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-sky-400" />
            <span>Dark Theme</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
              currentTheme === 'light'
                ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      {/* Tooltip Toggle */}
      <div className="pt-2 border-t border-slate-800">
        <Toggle
          label="Show Element Tooltip"
          description="Display tag, classes and dimensions on hover"
          checked={settings.showTooltip}
          onChange={(val) => onUpdateSettings({ showTooltip: val })}
        />
      </div>

      {/* Highlight Color & Opacity */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-200">
            Highlight Overlay Color
          </label>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block"
              style={{ backgroundColor: settings.highlightColor || '#38bdf8' }}
            />
            <input
              type="text"
              value={settings.highlightColor || '#38bdf8'}
              onChange={(e) => onUpdateSettings({ highlightColor: e.target.value })}
              className="w-16 px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 text-center uppercase"
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
                  ? 'border-white scale-110 shadow-sm'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Fill Opacity Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Overlay Fill Opacity</span>
            <span className="font-mono text-sky-300">
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
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Keyboard className="w-3.5 h-3.5 text-sky-400" />
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center justify-between py-0.5">
            <span>Toggle Inspection</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-sky-300 rounded border border-slate-700">
              {settings.shortcut || 'Alt+Shift+X'}
            </kbd>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span>Inspect Parent Element</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              &uarr; Up Arrow
            </kbd>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span>Inspect Child Element</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              &darr; Down Arrow
            </kbd>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span>Navigate Siblings</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              &larr; / &rarr; Left/Right
            </kbd>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span>Confirm Selection</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span>Exit / Cancel</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
