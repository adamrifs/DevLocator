import React from 'react';
import { Crosshair, XCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';

/**
 * ElementPicker: React control component for triggering and displaying inspection mode.
 */
export default function ElementPicker({
  isInspecting,
  onToggle,
  disabled = false,
  shortcut = 'Alt+Shift+X',
}) {
  return (
    <div className="space-y-3">
      <Button
        size="lg"
        variant={isInspecting ? 'danger' : 'primary'}
        icon={isInspecting ? XCircle : Crosshair}
        disabled={disabled}
        onClick={onToggle}
        className="w-full text-center shadow-md py-3"
      >
        {isInspecting ? 'Stop Inspection' : 'Inspect Element'}
      </Button>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Shortcut:</span>
        <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 text-sky-300 rounded border border-slate-700">
          {shortcut}
        </kbd>
      </div>
    </div>
  );
}

