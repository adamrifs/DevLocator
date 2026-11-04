import React from 'react';
import { ChevronRight, Layers } from 'lucide-react';

/**
 * ComponentTree renders the DOM ancestor hierarchy breadcrumbs and tree view.
 */
export default function ComponentTree({ hierarchy = [], onSelectAncestor }) {
  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="text-xs text-slate-400 py-3 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        No DOM hierarchy available.
      </div>
    );
  }

  const targetIndex = hierarchy.length - 1;

  return (
    <div className="space-y-3">
      {/* Breadcrumb Path Card */}
      <div className="flex items-center gap-1.5 flex-wrap p-3 rounded-2xl bg-white border border-slate-100/90 text-xs shadow-sm">
        <div className="w-6 h-6 rounded-xl bg-blue-50 text-[#0066ff] flex items-center justify-center shrink-0 mr-1">
          <Layers className="w-3.5 h-3.5" />
        </div>
        {hierarchy.map((item, idx) => {
          const isTarget = idx === targetIndex;
          const label = item.tagName + (item.id ? `#${item.id}` : '');

          return (
            <React.Fragment key={`${item.selector}-${idx}`}>
              <button
                type="button"
                onClick={() => onSelectAncestor && onSelectAncestor(item)}
                className={`px-2 py-0.5 rounded-xl font-mono text-[11px] transition-all text-left ${
                  isTarget
                    ? 'bg-[#0066ff] text-white font-semibold shadow-sm'
                    : 'bg-slate-50 border border-slate-200/70 text-slate-700 hover:text-[#0066ff] hover:bg-blue-50/50'
                }`}
                title={item.selector}
              >
                {label}
              </button>
              {idx < hierarchy.length - 1 && (
                <ChevronRight className="w-3 h-3 shrink-0 text-slate-300" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tree Indented View Card */}
      <div className="rounded-2xl bg-white border border-slate-100/90 p-3 text-xs font-mono max-h-48 overflow-y-auto space-y-1 shadow-sm">
        {hierarchy.map((item, idx) => {
          const isTarget = idx === targetIndex;
          const indent = idx * 12;

          return (
            <button
              key={`tree-${item.selector}-${idx}`}
              type="button"
              onClick={() => onSelectAncestor && onSelectAncestor(item)}
              style={{ paddingLeft: `${indent + 8}px` }}
              className={`w-full flex items-center gap-2 py-1 px-2 rounded-xl transition-all text-left ${
                isTarget
                  ? 'bg-blue-50/90 text-[#0066ff] font-bold border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="select-none text-slate-300">&bull;</span>
              <span className="font-semibold text-slate-900">&lt;{item.tagName}</span>
              {item.id && <span className="text-amber-500 font-medium">#{item.id}</span>}
              {item.className && (
                <span className="truncate max-w-[140px] text-slate-400 font-normal">
                  .{item.className.split(' ').slice(0, 2).join('.')}
                </span>
              )}
              <span className="font-semibold text-slate-900">&gt;</span>
              {isTarget && (
                <span className="ml-auto text-[9px] uppercase font-sans font-bold px-2 py-0.5 rounded-full bg-[#0066ff] text-white shadow-xs">
                  Target
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
