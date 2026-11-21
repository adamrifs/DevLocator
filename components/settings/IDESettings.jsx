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
    description: 'Open source in the installed VS Code application',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Open source in the installed Cursor application',
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
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
              isSelected
                ? 'bg-[#edf5ff] border-blue-200/90 shadow-xs'
                : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isSelected ? 'text-[#0066ff]' : 'text-slate-800'}`}>
                  {ide.name}
                </span>
                {ide.tag && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-100 text-[#0066ff]">
                    {ide.tag}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 font-normal">
                {ide.description}
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors ${
                isSelected
                  ? 'border-[#0066ff] bg-[#0066ff]'
                  : 'border-slate-300 bg-white'
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

