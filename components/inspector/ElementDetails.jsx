import React, { useState } from 'react';
import { Copy, Check, Hash, Tag, Box, Navigation, FileCode, CornerDownRight, Layers, Sparkles } from 'lucide-react';

/**
 * ElementDetails renders the Overview tab of the selected DOM element
 * using the modern soft-UI / iOS-inspired card aesthetic.
 */
export default function ElementDetails({ details, onSelectChild }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!details) {
    return (
      <div className="text-xs text-slate-400 py-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        No element selected. Hold Shift to inspect.
      </div>
    );
  }

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  const { dimensions, boxModel, attributes, textContent, selector, xpath, tagName, id, classList } = details;
  const idString = id ? `#${id}` : '';

  return (
    <div className="space-y-3.5">
      {/* 1. Primary Component Card (Styled like the "Class meeting" card in the design) */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Soft Squircle Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/60 text-[#0066ff] border border-blue-100/80 flex items-center justify-center shrink-0 shadow-xs">
              {details.componentName ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
            </div>

            {/* Element & Framework Info */}
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-900 text-sm truncate tracking-tight flex items-center gap-1.5">
                {details.componentName ? (
                  <span>&lt;{details.componentName} /&gt;</span>
                ) : (
                  <span>&lt;{tagName}{idString}&gt;</span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {details.framework || 'Vanilla HTML'} &bull; {dimensions?.width} &times; {dimensions?.height} px &bull; {details.childElementCount || 0} children
              </p>
            </div>
          </div>

          {/* Copy Selector Action */}
          <button
            type="button"
            onClick={() => copyToClipboard(selector, 'top-selector')}
            className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center shrink-0"
            title="Copy Selector"
          >
            {copiedKey === 'top-selector' ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Vibrant Blue Accent Progress Line (matching design reference) */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#0066ff] rounded-full w-4/5 transition-all duration-500" />
        </div>
      </div>

      {/* 2. Quick Selector & XPath Card */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-100/90 shadow-sm space-y-2.5">
        {/* CSS Selector Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Tag className="w-3.5 h-3.5 text-[#0066ff]" />
            <span className="font-semibold text-slate-700">Selector:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <code className="text-[11px] font-mono text-[#0066ff] truncate max-w-[200px]" title={selector}>
              {selector}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(selector, 'selector')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
              title="Copy CSS Selector"
            >
              {copiedKey === 'selector' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* XPath Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Navigation className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-700">XPath:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <code className="text-[11px] font-mono truncate max-w-[200px] text-amber-600" title={xpath}>
              {xpath}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(xpath, 'xpath')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
              title="Copy XPath"
            >
              {copiedKey === 'xpath' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Source File Location if detected */}
        {details.sourceFile && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-slate-700">Source:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <code className="text-[11px] font-mono truncate max-w-[200px] text-emerald-600" title={`${details.sourceFile}:${details.lineNumber || 1}`}>
                {details.sourceFile.split('/').slice(-2).join('/')}:{details.lineNumber || 1}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(`${details.sourceFile}:${details.lineNumber || 1}:${details.columnNumber || 1}`, 'source-loc')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                title="Copy Source Path (file:line:col)"
              >
                {copiedKey === 'source-loc' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Visual Box Model Card */}
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
