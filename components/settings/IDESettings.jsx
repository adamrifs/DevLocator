import React from 'react';

const SUPPORTED_IDES = [
  {
    id: 'antigravity',
    name: 'Antigravity',
    tag: 'Default',
    description: 'AI-first IDE with integrated code intelligence',
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    description: 'Standard code editor with vscode:// protocol',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI code editor with cursor:// protocol',
  },
];

export default function IDESettings({ selectedIde, onSelectIde }) {
  return (
    <div className="space-y-2">
      {SUPPORTED_IDES.map((ide) => {
        const isSelected = selectedIde === ide.id;
        return (
          <button
            key={ide.id}
            type="button"
            onClick={() => onSelectIde(ide.id)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
              isSelected
                ? 'bg-sky-500/10 border-sky-500/60 shadow-sm'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                  {ide.name}
                </span>
                {ide.tag && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                    {ide.tag}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {ide.description}
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                isSelected
                  ? 'border-sky-400 bg-sky-500'
                  : 'border-slate-600 bg-slate-900'
              }`}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
