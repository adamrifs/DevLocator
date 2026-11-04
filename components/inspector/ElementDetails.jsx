import React, { useState } from 'react';
import { Copy, Check, Hash, Tag, Box, Navigation, FileCode, CornerDownRight } from 'lucide-react';

/**
 * ElementDetails renders the Overview tab of the selected DOM element.
 */
export default function ElementDetails({ details, onSelectChild, theme = 'dark' }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!details) {
    return (
      <div className="text-xs text-slate-400 py-4 text-center">
        No element selected. Click "Inspect Element" to select one.
      </div>
    );
  }

  const isLight = theme === 'light';

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
      <div className={`p-3 rounded-lg border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
        {/* Framework & Component Header */}
        <div className={`flex items-center justify-between pb-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Framework:
            </span>
            <span className="text-xs font-semibold text-sky-400">
              {details.framework || 'Vanilla HTML'}
            </span>
          </div>
          {details.componentName && (
            <span className="text-xs font-mono font-bold text-sky-300">
              &lt;{details.componentName} /&gt;
            </span>
          )}
        </div>

        {/* CSS Selector Row */}
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 text-xs shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Tag className="w-3.5 h-3.5 text-sky-400" />
            <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Selector:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <code className="text-[11px] font-mono text-sky-300 truncate max-w-[200px]" title={selector}>
              {selector}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(selector, 'selector')}
              className={`p-1 rounded transition-colors shrink-0 ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
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

        {/* XPath Row */}
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 text-xs shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>XPath:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <code className={`text-[11px] font-mono truncate max-w-[200px] ${isLight ? 'text-amber-600' : 'text-amber-300'}`} title={xpath}>
              {xpath}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(xpath, 'xpath')}
              className={`p-1 rounded transition-colors shrink-0 ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
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

        {/* Source File Location if detected */}
        {details.sourceFile && (
          <div className={`flex items-center justify-between gap-2 pt-1.5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
            <div className={`flex items-center gap-1.5 text-xs shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Source:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <code className={`text-[11px] font-mono truncate max-w-[200px] ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`} title={`${details.sourceFile}:${details.lineNumber || 1}`}>
                {details.sourceFile.split('/').slice(-2).join('/')}:{details.lineNumber || 1}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(`${details.sourceFile}:${details.lineNumber || 1}:${details.columnNumber || 1}`, 'source-loc')}
                className={`p-1 rounded transition-colors shrink-0 ${isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Copy Source Path (file:line:col)"
              >
                {copiedKey === 'source-loc' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visual Box Model Diagram */}
      <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
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
          <div className={`border rounded p-1.5 text-center ${
            isLight
              ? 'bg-amber-100/50 border-amber-300 text-amber-900'
              : 'bg-amber-950/20 border-amber-600/40 text-amber-300/90'
          }`}>
            <div className="flex justify-between px-2 text-[9px] uppercase font-sans opacity-80">
              <span>margin</span>
              <span>{boxModel?.marginTop || '0'}</span>
              <span></span>
            </div>
            
            {/* Border Box */}
            <div className={`my-1 border rounded p-1.5 ${
              isLight
                ? 'bg-yellow-100/50 border-yellow-300 text-yellow-900'
                : 'bg-yellow-950/20 border-yellow-600/40 text-yellow-300/90'
            }`}>
              <div className="flex justify-between px-2 text-[9px] uppercase font-sans opacity-80">
                <span>border</span>
                <span>{boxModel?.borderTopWidth || '0'}</span>
                <span></span>
              </div>

              {/* Padding Box */}
              <div className={`my-1 border rounded p-1.5 ${
                isLight
                  ? 'bg-emerald-100/50 border-emerald-300 text-emerald-900'
                  : 'bg-emerald-950/20 border-emerald-600/40 text-emerald-300/90'
              }`}>
                <div className="flex justify-between px-2 text-[9px] uppercase font-sans opacity-80">
                  <span>padding</span>
                  <span>{boxModel?.paddingTop || '0'}</span>
                  <span></span>
                </div>

                {/* Content Box */}
                <div className={`py-2 px-1 rounded border text-center font-bold ${
                  isLight
                    ? 'bg-sky-100 border-sky-300 text-sky-900'
                    : 'bg-sky-950/40 border-sky-500/40 text-sky-300'
                }`}>
                  <span>
                    {dimensions?.width} &times; {dimensions?.height}
                  </span>
                </div>

                <div className="flex justify-between px-2 text-[9px] uppercase font-sans opacity-80 mt-1">
                  <span>{boxModel?.paddingLeft || '0'}</span>
                  <span>{boxModel?.paddingBottom || '0'}</span>
                  <span>{boxModel?.paddingRight || '0'}</span>
                </div>
              </div>

              <div className="flex justify-between px-2 text-[9px] uppercase font-sans opacity-80 mt-1">
                <span>{boxModel?.borderLeftWidth || '0'}</span>
                <span>{boxModel?.borderBottomWidth || '0'}</span>
                <span>{boxModel?.borderRightWidth || '0'}</span>
              </div>
            </div>

            <div className="flex justify-between px-2 text-[9px] uppercase font-sans opacity-80 mt-1">
              <span>{boxModel?.marginLeft || '0'}</span>
              <span>{boxModel?.marginBottom || '0'}</span>
              <span>{boxModel?.marginRight || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HTML Attributes List */}
      <div className={`p-3 rounded-lg border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          <Hash className="w-3.5 h-3.5 text-sky-400" />
          <span>HTML Attributes</span>
        </div>

        {attributes && Object.keys(attributes).length > 0 ? (
          <div className="space-y-1 font-mono text-xs">
            {Object.entries(attributes).map(([attrName, attrValue]) => (
              <div
                key={attrName}
                className={`flex items-start justify-between py-1 px-1.5 rounded transition-colors ${
                  isLight ? 'hover:bg-slate-200/60' : 'hover:bg-slate-800/50'
                }`}
              >
                <span className="text-sky-400 font-semibold shrink-0">{attrName}</span>
                <span className={`text-[11px] truncate max-w-[200px] text-right ${isLight ? 'text-slate-700' : 'text-slate-300'}`} title={attrValue}>
                  "{attrValue}"
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-1">No custom attributes on this element.</div>
        )}
      </div>

      {/* Direct Children Section */}
      {details.children && details.children.length > 0 && (
        <div className={`p-3 rounded-lg border space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className={`flex items-center justify-between text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <div className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-sky-400" />
              <span>Direct Children ({details.childElementCount})</span>
            </div>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Click to inspect</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {details.children.map((child, idx) => {
              const childLabel = child.tagName + (child.id ? `#${child.id}` : child.className ? `.${child.className.split(' ')[0]}` : '');
              return (
                <button
                  key={`${child.selector}-${idx}`}
                  type="button"
                  onClick={() => onSelectChild && onSelectChild(child)}
                  className={`px-2 py-1 rounded border font-mono text-[11px] transition-colors flex items-center gap-1 ${
                    isLight
                      ? 'bg-slate-200/80 hover:bg-slate-300/80 border-slate-300 text-sky-700'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-sky-300'
                  }`}
                  title={child.selector}
                >
                  <span>&lt;{childLabel}&gt;</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Text Content Preview if present */}
      {textContent && (
        <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Inner Text Preview
          </span>
          <p className={`text-xs font-sans italic line-clamp-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            "{textContent}"
          </p>
        </div>
      )}
    </div>
  );
}
