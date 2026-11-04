import React, { useState } from 'react';
import {
  Crosshair,
  X,
  Minus,
  Maximize2,
  Code,
  Sparkles,
  Info,
  Palette,
  FileCode,
  Layers,
  Search,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import ElementDetails from './ElementDetails.jsx';
import ComponentTree from './ComponentTree.jsx';
import { MESSAGE_TYPES } from '../../utils/messages.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'styles', label: 'Styles', icon: Palette },
  { id: 'html', label: 'HTML', icon: Code },
  { id: 'component', label: 'Component', icon: Layers },
  { id: 'source', label: 'Source', icon: FileCode },
];

/**
 * InspectorPanel renders the comprehensive in-page DevLocator panel.
 * Mounts in open ShadowRoot so styles do not interfere with host web application.
 */
export default function InspectorPanel({
  details,
  onClose,
  onReinspect,
  onSelectAncestor,
  ide = 'antigravity',
  theme = 'dark',
  isEmbedded = false, // true if rendered inside popup, false if floating overlay
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [styleFilter, setStyleFilter] = useState('');
  const [openStatus, setOpenStatus] = useState(null); // { type: 'loading'|'success'|'error', text: string }

  if (!details) return null;

  const isLight = theme === 'light';

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  const { tagName, id, classList, selector, outerHTML, styles, domHierarchy } = details;
  const idString = id ? `#${id}` : '';
  const classString = classList?.length ? `.${classList.slice(0, 2).join('.')}` : '';

  // Minimized compact view
  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-[2147483647] border rounded-full shadow-2xl p-2 flex items-center gap-3 text-xs backdrop-blur select-none ${
        isLight
          ? 'bg-white/95 border-slate-300 text-slate-800'
          : 'bg-slate-900 border-slate-700/80 text-white'
      }`}>
        <div className="flex items-center gap-2 pl-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-mono font-semibold text-sky-400">
            &lt;{tagName}{idString}&gt;
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={`p-1 rounded-full ${
            isLight
              ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Expand Inspector"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-500"
          title="Close Inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col font-sans select-none border shadow-2xl ${
        isLight
          ? 'bg-white text-slate-900 border-slate-200'
          : 'bg-slate-950 text-slate-100 border-slate-800'
      } ${
        isEmbedded
          ? 'w-full h-full'
          : 'fixed bottom-4 right-4 z-[2147483647] w-[400px] max-h-[580px] rounded-xl overflow-hidden'
      }`}
    >
      {/* Top Header */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Crosshair className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-xs font-mono font-bold text-sky-400 truncate">
              &lt;{tagName}
            </span>
            {id && <span className="text-xs font-mono text-amber-500 truncate">#{id}</span>}
            {classString && <span className={`text-xs font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{classString}</span>}
            <span className="text-xs font-mono font-bold text-sky-400">&gt;</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Navigate to Parent */}
          {details.parent && (
            <button
              type="button"
              onClick={() => onSelectAncestor?.(details.parent)}
              className={`p-1.5 rounded transition-colors ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-sky-300'
              }`}
              title={`Inspect Parent <${details.parent.tagName}> (Up Arrow)`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Navigate to First Child */}
          {details.children && details.children.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectAncestor?.(details.children[0])}
              className={`p-1.5 rounded transition-colors ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-sky-300'
              }`}
              title={`Inspect Child <${details.children[0].tagName}> (Down Arrow)`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {onReinspect && (
            <button
              type="button"
              onClick={onReinspect}
              className={`p-1.5 rounded transition-colors ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-sky-300'
              }`}
              title="Pick Another Element"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
          {!isEmbedded && (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className={`p-1.5 rounded transition-colors ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className={`flex items-center px-2 border-b overflow-x-auto ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? isLight
                    ? 'text-sky-600 border-sky-600 bg-sky-50/80'
                    : 'text-sky-400 border-sky-400 bg-sky-950/20'
                  : isLight
                  ? 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'source' && details.sourceFile && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 max-h-[460px]">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <ElementDetails details={details} onSelectChild={onSelectAncestor} theme={theme} />
            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`text-xs font-semibold block mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                DOM Hierarchy
              </span>
              <ComponentTree
                hierarchy={domHierarchy}
                onSelectAncestor={onSelectAncestor}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* 2. STYLES TAB */}
        {activeTab === 'styles' && (
          <div className="space-y-3">
            {/* Search / Filter styles */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Filter computed styles..."
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-md font-mono focus:outline-none focus:border-sky-500 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                }`}
              />
            </div>

            {styles && Object.entries(styles).map(([categoryName, propMap]) => {
              const filteredProps = Object.entries(propMap).filter(
                ([prop, val]) =>
                  prop.toLowerCase().includes(styleFilter.toLowerCase()) ||
                  String(val).toLowerCase().includes(styleFilter.toLowerCase())
              );

              if (filteredProps.length === 0) return null;

              return (
                <div key={categoryName} className={`rounded-lg border p-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block mb-2 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {categoryName}
                  </span>
                  <div className="space-y-1 font-mono text-xs">
                    {filteredProps.map(([property, value]) => (
                      <div
                        key={property}
                        className={`flex items-center justify-between py-0.5 px-1.5 rounded ${
                          isLight ? 'hover:bg-slate-200/50' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-sky-400 font-medium">{property}:</span>
                        <span className={`truncate max-w-[200px] ${isLight ? 'text-slate-700' : 'text-slate-200'}`} title={String(value)}>
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. HTML TAB */}
        {activeTab === 'html' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Outer HTML Snippet
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(outerHTML, 'html')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded transition-colors"
              >
                {copiedKey === 'html' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HTML</span>
                  </>
                )}
              </button>
            </div>

            <pre className={`p-3 rounded-lg border text-[11px] font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-72 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <code>{outerHTML}</code>
            </pre>
          </div>
        )}

        {/* 4. COMPONENT TAB */}
        {activeTab === 'component' && (
          <div className="space-y-3">
            {/* Framework Identification Card */}
            <div className={`p-3.5 rounded-lg border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Detected Framework
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  details.framework?.includes('React')
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : details.framework?.includes('Vue')
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : details.framework?.includes('Angular')
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : isLight
                    ? 'bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {details.framework || 'Vanilla HTML'}
                </span>
              </div>

              {/* Component Name */}
              {details.componentName ? (
                <div className={`pt-2 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <div>
                    <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Component Name
                    </span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      &lt;{details.componentName} /&gt;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(details.componentName, 'comp-name')}
                    className={`p-1 rounded transition-colors ${
                      isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Copy Component Name"
                  >
                    {copiedKey === 'comp-name' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className={`pt-2 border-t text-xs italic ${
                  isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'
                }`}>
                  {details.framework === 'Vanilla HTML'
                    ? 'Standard DOM element (no framework component wrapper).'
                    : 'No specific component name resolved for this DOM node.'}
                </div>
              )}

              {/* Confidence Badge */}
              <div className={`flex items-center justify-between pt-2 border-t text-xs ${
                isLight ? 'border-slate-200' : 'border-slate-800/80'
              }`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Detection Confidence:</span>
                <span className={`capitalize font-medium ${
                  details.confidence === 'high'
                    ? 'text-emerald-500'
                    : details.confidence === 'partial'
                    ? 'text-sky-500'
                    : 'text-amber-500'
                }`}>
                  {details.confidence || 'partial'}
                </span>
              </div>
            </div>

            {/* Component Hierarchy */}
            {details.componentHierarchy && details.componentHierarchy.length > 0 && (
              <div className={`p-3 rounded-lg border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <span className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Component Hierarchy
                </span>
                <div className="space-y-1 font-mono text-xs">
                  {details.componentHierarchy.map((comp, idx) => {
                    const isTarget = idx === details.componentHierarchy.length - 1;
                    return (
                      <div
                        key={`${comp}-${idx}`}
                        style={{ paddingLeft: `${idx * 10}px` }}
                        className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded ${
                          isTarget
                            ? isLight
                              ? 'bg-sky-100 text-sky-800 font-bold'
                              : 'bg-sky-500/15 text-sky-300 font-bold'
                            : isLight
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>&bull;</span>
                        <span>&lt;{comp} /&gt;</span>
                        {isTarget && (
                          <span className="ml-auto text-[9px] uppercase font-sans font-bold px-1 rounded bg-sky-500/20 text-sky-400">
                            Target
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. SOURCE TAB */}
        {activeTab === 'source' && (
          <div className="space-y-3">
            {details.sourceFile ? (
              <div className={`p-3.5 rounded-lg border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Source Code Location
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    details.sourceVerified
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {details.sourceVerified ? 'Verified' : 'Approximate'}
                  </span>
                </div>

                {/* Source File */}
                <div className={`pt-2 border-t space-y-1 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    File Path
                  </span>
                  <div className={`flex items-center justify-between gap-2 p-2 rounded border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <code className={`text-xs font-mono break-all ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`} title={details.sourceFile}>
                      {details.sourceFile}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(details.sourceFile, 'source-file')}
                      className={`p-1 rounded transition-colors shrink-0 ${
                        isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Copy File Path"
                    >
                      {copiedKey === 'source-file' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Line and Column */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className={`p-2 rounded border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Line Number
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {details.lineNumber ? `Line ${details.lineNumber}` : 'Unknown'}
                    </span>
                  </div>
                  <div className={`p-2 rounded border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/40 border-slate-800'
                  }`}>
                    <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Column
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {details.columnNumber ? `Col ${details.columnNumber}` : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Detection Strategy */}
                <div className={`flex items-center justify-between pt-2 border-t text-xs ${
                  isLight ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Strategy:</span>
                  <span className={`font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {details.sourceStrategy === 'vite-plugin'
                      ? 'Vite Plugin Metadata'
                      : details.sourceStrategy === 'react-debug-source'
                      ? 'React Fiber Debug Source'
                      : details.sourceStrategy === 'vue-file'
                      ? 'Vue SFC File'
                      : 'Source Map'}
                  </span>
                </div>

                {/* Target Editor Action */}
                <div className={`pt-2 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Target Editor:</span>
                    <span className="font-semibold text-sky-400 capitalize">{ide}</span>
                  </div>
                  <button
                    type="button"
                    disabled={openStatus?.type === 'loading'}
                    onClick={() => {
                      setOpenStatus({ type: 'loading', text: `Launching in ${ide}...` });
                      chrome.runtime?.sendMessage?.(
                        {
                          type: MESSAGE_TYPES.OPEN_SOURCE_IN_IDE,
                          payload: {
                            file: details.sourceFile,
                            line: details.lineNumber || 1,
                            column: details.columnNumber || 1,
                            ide,
                          },
                        },
                        (response) => {
                          if (chrome.runtime.lastError || !response || !response.success) {
                            const errMessage = response?.message || chrome.runtime.lastError?.message || 'Could not launch IDE directly.';
                            // Copy to clipboard as automatic fallback
                            const loc = `${details.sourceFile}:${details.lineNumber || 1}:${details.columnNumber || 1}`;
                            navigator.clipboard.writeText(loc);
                            setOpenStatus({
                              type: 'error',
                              text: `${errMessage} (Location copied)`,
                            });
                          } else {
                            setOpenStatus({
                              type: 'success',
                              text: response.message || `Opened in ${ide}!`,
                            });
                          }
                          setTimeout(() => setOpenStatus(null), 4000);
                        }
                      );
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-sky-950/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {openStatus?.type === 'loading'
                        ? 'Launching...'
                        : `Open in ${ide.charAt(0).toUpperCase() + ide.slice(1)}`}
                    </span>
                  </button>

                  {/* Status Banner */}
                  {openStatus && (
                    <div className={`p-2 rounded text-[11px] font-medium text-center ${
                      openStatus.type === 'success'
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                        : openStatus.type === 'loading'
                        ? 'bg-sky-950/40 text-sky-300 border border-sky-800/50'
                        : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                    }`}>
                      {openStatus.text}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-lg border text-center space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
                }`}>
                  <FileCode className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                  <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Source Location Metadata Not Available
                  </h4>
                  <p className={`text-[11px] leading-relaxed max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    This element does not have DevLocator compilation metadata or React Fiber <code className="text-amber-500 font-mono">_debugSource</code> attached.
                  </p>
                </div>

                <div className={`p-3 rounded-lg border space-y-2 text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
                }`}>
                  <span className={`text-[11px] font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    How to enable 1-click source jump:
                  </span>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Add the DevLocator plugin to your <code className="text-sky-400 font-mono">vite.config.js</code> during development:
                  </p>
                  <pre className={`p-2 rounded font-mono text-[10px] text-sky-400 overflow-x-auto border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800/80'
                  }`}>
                    <code>{`// vite.config.js\nimport devlocator from './integrations/vite-plugin';\n\nexport default {\n  plugins: [devlocator()],\n};`}</code>
                  </pre>
                </div>

                <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
                }`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Target Code Editor:</span>
                  <span className="font-semibold text-sky-400 capitalize">{ide}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className={`px-3.5 py-2 border-t flex items-center justify-between text-[11px] ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-slate-800 text-slate-400'
      }`}>
        <span className="truncate max-w-[240px]">
          Selector: <span className={`font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{selector}</span>
        </span>
        <button
          type="button"
          onClick={() => copyToClipboard(selector, 'footer-selector')}
          className="text-sky-400 hover:text-sky-300 font-medium"
        >
          {copiedKey === 'footer-selector' ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
