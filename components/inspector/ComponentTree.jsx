import React from 'react';
import { ChevronRight, Layers } from 'lucide-react';

/**
 * ComponentTree renders the DOM ancestor hierarchy breadcrumbs and tree view.
 */
export default function ComponentTree({ hierarchy = [], onSelectAncestor, theme = 'dark' }) {
  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="text-xs text-slate-400 py-2">
        No DOM hierarchy available.
      </div>
    );
  }

  const isLight = theme === 'light';
  const targetIndex = hierarchy.length - 1;

  return (
    <div className="space-y-3">
      {/* Breadcrumb Path */}
      <div className={`flex items-center gap-1.5 flex-wrap p-2 rounded-lg border text-xs ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0 mr-1" />
        {hierarchy.map((item, idx) => {
          const isTarget = idx === targetIndex;
          const label = item.tagName + (item.id ? `#${item.id}` : '');

          return (
            <React.Fragment key={`${item.selector}-${idx}`}>
              <button
                type="button"
                onClick={() => onSelectAncestor && onSelectAncestor(item)}
                className={`px-1.5 py-0.5 rounded transition-colors text-left ${
                  isTarget
                    ? isLight
                      ? 'bg-sky-100 text-sky-700 font-semibold border border-sky-300'
                      : 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={item.selector}
              >
                {label}
              </button>
              {idx < hierarchy.length - 1 && (
                <ChevronRight className={`w-3 h-3 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tree Indented View */}
      <div className={`rounded-lg border p-2 text-xs font-mono max-h-48 overflow-y-auto space-y-1 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        {hierarchy.map((item, idx) => {
          const isTarget = idx === targetIndex;
          const indent = idx * 12;

          return (
            <div
              key={`tree-${item.selector}-${idx}`}
              style={{ paddingLeft: `${indent}px` }}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded transition-colors ${
                isTarget
                  ? isLight
                    ? 'bg-sky-100/80 text-slate-900 font-bold border-l-2 border-sky-500'
                    : 'bg-sky-500/15 text-sky-200 font-bold border-l-2 border-sky-400'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <span className={`select-none ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>&bull;</span>
              <span className="text-sky-400 font-semibold">&lt;{item.tagName}</span>
              {item.id && <span className="text-amber-500">#{item.id}</span>}
              {item.className && (
                <span className={`truncate max-w-[140px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  .{item.className.split(' ').slice(0, 2).join('.')}
                </span>
              )}
              <span className="text-sky-400 font-semibold">&gt;</span>
              {isTarget && (
                <span className="ml-auto text-[10px] uppercase font-sans font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400">
                  Target
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
