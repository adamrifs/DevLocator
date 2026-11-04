import React, { useState } from 'react';
import { Copy, Check, Hash, Tag, Box, Navigation } from 'lucide-react';

/**
 * ElementDetails renders the Overview tab of the selected DOM element.
 */
export default function ElementDetails({ details }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!details) {
    return (
      <div className="text-xs text-slate-400 py-4 text-center">
        No element selected. Click "Inspect Element" to select one.
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

  return (
    <div className="space-y-4">
      {/* Quick Selectors & Copy Card */}
      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
        {/* Framework & Component Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Framework:
            </span>
            <span className="text-xs font-semibold text-sky-400">
              {details.framework || 'Vanilla HTML'}
            </span>
          </div>
          {details.componentName && (
            <span className="text-[11px] font-mono font-bold text-amber-300">
              &lt;{details.componentName} /&gt;
            </span>
          )}
        </div>

        {/* CSS Selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Tag className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-300">Selector:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <code className="text-[11px] font-mono text-sky-300 truncate max-w-[200px]" title={selector}>
              {selector}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(selector, 'selector')}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0"
              title="Copy CSS Selector"
            >
              {copiedKey === 'selector' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* XPath */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">XPath:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <code className="text-[11px] font-mono text-amber-300 truncate max-w-[200px]" title={xpath}>
              {xpath}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(xpath, 'xpath')}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0"
              title="Copy XPath"
            >
              {copiedKey === 'xpath' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Box Model Diagram */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span>Box Model &amp; Dimensions</span>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            {dimensions?.width} &times; {dimensions?.height} px
          </span>
        </div>

        {/* Nested Box Model visualization */}
        <div className="text-[10px] font-mono select-none">
          {/* Margin Outer Box */}
          <div className="bg-amber-950/20 border border-amber-600/40 rounded p-1.5 text-amber-300/90 text-center">
            <div className="flex justify-between px-2 text-[9px] text-amber-400/80 uppercase font-sans">
              <span>margin</span>
              <span>{boxModel?.marginTop || '0'}</span>
              <span></span>
            </div>
            
            {/* Border Box */}
            <div className="my-1 bg-yellow-950/20 border border-yellow-600/40 rounded p-1.5 text-yellow-300/90">
              <div className="flex justify-between px-2 text-[9px] text-yellow-400/80 uppercase font-sans">
                <span>border</span>
                <span>{boxModel?.borderTopWidth || '0'}</span>
                <span></span>
              </div>

              {/* Padding Box */}
              <div className="my-1 bg-emerald-950/20 border border-emerald-600/40 rounded p-1.5 text-emerald-300/90">
                <div className="flex justify-between px-2 text-[9px] text-emerald-400/80 uppercase font-sans">
                  <span>padding</span>
                  <span>{boxModel?.paddingTop || '0'}</span>
                  <span></span>
                </div>

                {/* Content Box */}
                <div className="my-1 bg-sky-950/40 border border-sky-500/50 rounded py-2 px-3 text-sky-200 font-semibold text-xs">
                  {dimensions?.width} &times; {dimensions?.height}
                </div>

                <div className="flex justify-center text-[9px] text-emerald-400/80">
                  {boxModel?.paddingBottom || '0'}
                </div>
              </div>

              <div className="flex justify-center text-[9px] text-yellow-400/80">
                {boxModel?.borderBottomWidth || '0'}
              </div>
            </div>

            <div className="flex justify-center text-[9px] text-amber-400/80">
              {boxModel?.marginBottom || '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Section */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Hash className="w-3.5 h-3.5 text-sky-400" />
          <span>Element Attributes</span>
        </div>

        {attributes && Object.keys(attributes).length > 0 ? (
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {Object.entries(attributes).map(([attrName, attrValue]) => (
              <div
                key={attrName}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/40 border border-slate-800"
              >
                <span className="font-mono text-sky-400 font-medium">{attrName}</span>
                <span
                  className="font-mono text-slate-300 truncate max-w-[180px] ml-2"
                  title={attrValue}
                >
                  "{attrValue}"
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No custom attributes on this element.</div>
        )}
      </div>

      {/* Text Content Preview if present */}
      {textContent && (
        <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Text Preview
          </span>
          <p className="text-xs text-slate-300 italic font-sans break-words">
            "{textContent}"
          </p>
        </div>
      )}
    </div>
  );
}

