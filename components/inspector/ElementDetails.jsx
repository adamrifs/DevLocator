import React from 'react';
import { Hash, Box, CornerDownRight } from 'lucide-react';

/**
 * ElementDetails renders the secondary inspection details for the Overview tab
 * (Box Model & Geometry, Direct Children, HTML Attributes, Text Preview).
 */
export default function ElementDetails({ details, onSelectChild }) {
  if (!details) {
    return (
      <div className="text-xs text-slate-400 py-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        No element selected. Hold Shift to inspect.
      </div>
    );
  }

  const { dimensions, boxModel, attributes, textContent } = details;

  return (
    <div className="space-y-3.5">
      {/* 1. Visual Box Model Card */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-100/90 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Box className="w-3.5 h-3.5 text-[#0066ff]" />
            <span>Box Model &amp; Geometry</span>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0066ff] border border-blue-100">
            {dimensions?.width} &times; {dimensions?.height} px
          </span>
        </div>

        {/* Nested Soft Box Model Visualization */}
        <div className="text-[10px] font-mono select-none">
          {/* Margin Outer Box */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-2 text-center text-amber-900">
            <div className="flex justify-between px-2 text-[9px] uppercase font-sans text-amber-700 font-semibold">
              <span>margin</span>
              <span>{boxModel?.marginTop || '0'}</span>
              <span></span>
            </div>
            
            {/* Border Box */}
            <div className="my-1.5 bg-yellow-50/70 border border-yellow-200/80 rounded-xl p-2 text-yellow-900">
              <div className="flex justify-between px-2 text-[9px] uppercase font-sans text-yellow-700 font-semibold">
                <span>border</span>
                <span>{boxModel?.borderTopWidth || '0'}</span>
                <span></span>
              </div>

              {/* Padding Box */}
              <div className="my-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 text-emerald-900">
                <div className="flex justify-between px-2 text-[9px] uppercase font-sans text-emerald-700 font-semibold">
                  <span>padding</span>
                  <span>{boxModel?.paddingTop || '0'}</span>
                  <span></span>
                </div>

                {/* Content Box */}
                <div className="py-2.5 px-2 rounded-md bg-white border border-blue-200 text-[#0066ff] text-center font-bold shadow-xs">
                  <span>
                    {dimensions?.width} &times; {dimensions?.height}
                  </span>
                </div>

                <div className="flex justify-between px-2 text-[9px] uppercase font-sans text-emerald-700 font-semibold mt-1">
                  <span>{boxModel?.paddingLeft || '0'}</span>
                  <span>{boxModel?.paddingBottom || '0'}</span>
                  <span>{boxModel?.paddingRight || '0'}</span>
                </div>
              </div>

              <div className="flex justify-between px-2 text-[9px] uppercase font-sans text-yellow-700 font-semibold mt-1">
                <span>{boxModel?.borderLeftWidth || '0'}</span>
                <span>{boxModel?.borderBottomWidth || '0'}</span>
                <span>{boxModel?.borderRightWidth || '0'}</span>
              </div>
            </div>

            <div className="flex justify-between px-2 text-[9px] uppercase font-sans text-amber-700 font-semibold mt-1">
              <span>{boxModel?.marginLeft || '0'}</span>
              <span>{boxModel?.marginBottom || '0'}</span>
              <span>{boxModel?.marginRight || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Direct Children Section */}
      {details.children && details.children.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-100/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-[#0066ff]" />
              <span>Direct Children ({details.childElementCount})</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Click to inspect</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {details.children.map((child, idx) => {
              const childLabel = child.tagName + (child.id ? `#${child.id}` : child.className ? `.${child.className.split(' ')[0]}` : '');
              return (
                <button
                  key={`${child.selector}-${idx}`}
                  type="button"
                  onClick={() => onSelectChild && onSelectChild(child)}
                  className="px-3 py-1 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200/70 text-slate-700 hover:text-[#0066ff] font-mono text-[11px] transition-all shadow-xs flex items-center gap-1"
                  title={child.selector}
                >
                  <span>&lt;{childLabel}&gt;</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. HTML Attributes List */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-100/90 shadow-sm space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Hash className="w-3.5 h-3.5 text-[#0066ff]" />
          <span>HTML Attributes</span>
        </div>

        {attributes && Object.keys(attributes).length > 0 ? (
          <div className="space-y-1 font-mono text-xs pt-1">
            {Object.entries(attributes).map(([attrName, attrValue]) => (
              <div
                key={attrName}
                className="flex items-start justify-between py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <span className="text-[#0066ff] font-semibold shrink-0">{attrName}</span>
                <span className="text-[11px] truncate max-w-[200px] text-right text-slate-600 font-normal" title={attrValue}>
                  "{attrValue}"
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-1">No custom attributes on this element.</div>
        )}
      </div>

      {/* 6. Text Content Preview if present */}
      {textContent && (
        <div className="p-3 rounded-2xl bg-white border border-slate-100/90 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider block mb-1 text-slate-400">
            Inner Text Preview
          </span>
          <p className="text-xs font-sans italic line-clamp-3 text-slate-700">
            "{textContent}"
          </p>
        </div>
      )}
    </div>
  );
}
