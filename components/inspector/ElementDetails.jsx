import React, { useState } from 'react';
import { Hash, Box, CornerDownRight, Monitor, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Formats dimension values (e.g. 1657.1 or 587.4).
 */
function formatDim(val) {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return String(val);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

/**
 * Formats box model numerical values (without 'px' unit for a clean professional look).
 */
function formatVal(val) {
  if (val === undefined || val === null || val === '') return '0';
  const str = String(val).trim();
  if (str === '0' || str === '0px' || str === 'auto') return str === 'auto' ? 'auto' : '0';
  const num = parseFloat(str);
  if (isNaN(num)) return str.replace(/px$/i, '');
  return Number.isInteger(num) ? `${num}` : `${num.toFixed(1)}`;
}

/**
 * ElementDetails renders the secondary inspection details for the Overview tab
 * (Box Model & Geometry, Direct Children, HTML Attributes, Text Preview).
 */
export default function ElementDetails({ details, onSelectChild }) {
  const [isExpanded, setIsExpanded] = useState(true);

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
      {/* 1. Visual Box Model & Dimensions Card (Exact match of design reference) */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] space-y-3">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#0066ff]" />
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Box Model &amp; Dimensions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#edf5ff] text-[#0066ff] border border-blue-200/60 shadow-xs whitespace-nowrap shrink-0">
              {formatDim(dimensions?.width)} &times; {formatDim(dimensions?.height)}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Box Model Visualization */}
        {isExpanded && (
          <div className="text-[11px] font-mono select-none pt-0.5">
            {/* LAYER 1: MARGIN (Outer Box with dashed outline) */}
            <div className="rounded-2xl p-2 border border-dashed border-blue-300/80 bg-[#f7faff]">
              {/* Margin Top Row */}
              <div className="relative flex items-center justify-center mb-1 min-h-[16px]">
                <span className="absolute left-1 text-[10px] uppercase font-sans font-bold tracking-wider text-slate-400">
                  MARGIN
                </span>
                <span className={`text-xs font-bold ${formatVal(boxModel?.marginTop) !== '0' ? 'text-[#0066ff]' : 'text-slate-400'}`}>
                  {formatVal(boxModel?.marginTop)}
                </span>
              </div>

              {/* Margin Middle Row (Left Flank + Inner Border Box + Right Flank) */}
              <div className="flex items-center justify-between gap-1">
                {/* Margin Left */}
                <span className={`w-8 shrink-0 text-center font-bold ${formatVal(boxModel?.marginLeft) !== '0' ? 'text-[#0066ff]' : 'text-slate-400'}`}>
                  {formatVal(boxModel?.marginLeft)}
                </span>

                {/* LAYER 2: BORDER (Warm Peach / Vanilla Cream) */}
                <div className="flex-1 min-w-0 rounded-xl p-2 border border-amber-200/70 bg-[#fff7ee]">
                  {/* Border Top Row */}
                  <div className="relative flex items-center justify-center mb-1 min-h-[16px]">
                    <span className="absolute left-1 text-[10px] uppercase font-sans font-bold tracking-wider text-slate-500">
                      BORDER
                    </span>
                    <span className={`text-xs font-bold ${formatVal(boxModel?.borderTopWidth) !== '0' ? 'text-[#0066ff]' : 'text-slate-600'}`}>
                      {formatVal(boxModel?.borderTopWidth)}
                    </span>
                  </div>

                  {/* Border Middle Row (Left Flank + Inner Padding Box + Right Flank) */}
                  <div className="flex items-center justify-between gap-1">
                    {/* Border Left */}
                    <span className={`w-8 shrink-0 text-center font-bold ${formatVal(boxModel?.borderLeftWidth) !== '0' ? 'text-[#0066ff]' : 'text-slate-500'}`}>
                      {formatVal(boxModel?.borderLeftWidth)}
                    </span>

                    {/* LAYER 3: PADDING (Soft Mint / Cyan-Emerald Pastel) */}
                    <div className="flex-1 min-w-0 rounded-xl p-2 border border-emerald-200/70 bg-[#e1f8f4]">
                      {/* Padding Top Row */}
                      <div className="relative flex items-center justify-center mb-1 min-h-[16px]">
                        <span className="absolute left-1 text-[10px] uppercase font-sans font-bold tracking-wider text-slate-600">
                          PADDING
                        </span>
                        <span className={`text-xs font-bold ${formatVal(boxModel?.paddingTop) !== '0' ? 'text-[#0066ff]' : 'text-slate-700'}`}>
                          {formatVal(boxModel?.paddingTop)}
                        </span>
                      </div>

                      {/* Padding Middle Row (Left Flank + Center Content Pill + Right Flank) */}
                      <div className="flex items-center justify-between gap-1.5 my-1">
                        {/* Padding Left */}
                        <span className={`w-8 shrink-0 text-center font-bold ${formatVal(boxModel?.paddingLeft) !== '0' ? 'text-[#0066ff]' : 'text-slate-700'}`}>
                          {formatVal(boxModel?.paddingLeft)}
                        </span>

                        {/* LAYER 4: CONTENT (Soft Sky Blue Pill) */}
                        <div className="flex-1 min-w-0 py-2 px-3 rounded-xl bg-[#cde4fe] border border-white/90 shadow-xs flex items-center justify-center gap-2">
                          <Monitor className="w-4 h-4 text-[#0066ff] shrink-0" />
                          <span className="text-xs font-bold text-[#0066ff] tracking-tight truncate">
                            {formatDim(dimensions?.width)} &times; {formatDim(dimensions?.height)}
                          </span>
                        </div>

                        {/* Padding Right */}
                        <span className={`w-8 shrink-0 text-center font-bold ${formatVal(boxModel?.paddingRight) !== '0' ? 'text-[#0066ff]' : 'text-slate-700'}`}>
                          {formatVal(boxModel?.paddingRight)}
                        </span>
                      </div>

                      {/* Padding Bottom Row */}
                      <div className="flex items-center justify-center mt-1">
                        <span className={`text-xs font-bold ${formatVal(boxModel?.paddingBottom) !== '0' ? 'text-[#0066ff]' : 'text-slate-700'}`}>
                          {formatVal(boxModel?.paddingBottom)}
                        </span>
                      </div>
                    </div>

                    {/* Border Right */}
                    <span className={`w-8 shrink-0 text-center font-bold ${formatVal(boxModel?.borderRightWidth) !== '0' ? 'text-[#0066ff]' : 'text-slate-500'}`}>
                      {formatVal(boxModel?.borderRightWidth)}
                    </span>
                  </div>

                  {/* Border Bottom Row */}
                  <div className="flex items-center justify-center mt-1">
                    <span className={`text-xs font-bold ${formatVal(boxModel?.borderBottomWidth) !== '0' ? 'text-[#0066ff]' : 'text-slate-600'}`}>
                      {formatVal(boxModel?.borderBottomWidth)}
                    </span>
                  </div>
                </div>

                {/* Margin Right */}
                <span className={`w-8 shrink-0 text-center font-bold ${formatVal(boxModel?.marginRight) !== '0' ? 'text-[#0066ff]' : 'text-slate-400'}`}>
                  {formatVal(boxModel?.marginRight)}
                </span>
              </div>

              {/* Margin Bottom Row */}
              <div className="flex items-center justify-center mt-1">
                <span className={`text-xs font-bold ${formatVal(boxModel?.marginBottom) !== '0' ? 'text-[#0066ff]' : 'text-slate-400'}`}>
                  {formatVal(boxModel?.marginBottom)}
                </span>
              </div>
            </div>
          </div>
        )}
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
