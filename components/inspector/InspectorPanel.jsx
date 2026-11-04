import React, { useState } from 'react';
import {
  Crosshair,
  X,
  Minus,
  Maximize2,
  Copy,
  Check,
  Code2,
  FileCode,
  Palette,
  Info,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import ElementDetails from './ElementDetails.jsx';
import ComponentTree from './ComponentTree.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'styles', label: 'Styles', icon: Palette },
  { id: 'html', label: 'HTML', icon: Code2 },
  { id: 'component', label: 'Component', icon: Layers },
  { id: 'source', label: 'Source', icon: FileCode },
];

/**
 * InspectorPanel: Complete tab-based developer inspection panel.
 */
export default function InspectorPanel({
  details,
  onClose,
  onReinspect,
  onSelectAncestor,
  ide = 'antigravity',
  isEmbedded = false, // true if rendered inside popup, false if floating overlay
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [styleFilter, setStyleFilter] = useState('');

  if (!details) return null;

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
      <div className="fixed bottom-4 right-4 z-[2147483647] bg-slate-900 border border-slate-700/80 rounded-full shadow-2xl p-2 flex items-center gap-3 text-xs text-white backdrop-blur select-none">
        <div className="flex items-center gap-2 pl-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-mono font-semibold text-sky-300">
            &lt;{tagName}{idString}&gt;
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white"
          title="Expand Inspector"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
          title="Close Inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-950 text-slate-100 flex flex-col font-sans select-none border border-slate-800 shadow-2xl ${
        isEmbedded
          ? 'w-full h-full'
          : 'fixed bottom-4 right-4 z-[2147483647] w-[400px] max-h-[580px] rounded-xl overflow-hidden'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Crosshair className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-xs font-mono font-bold text-sky-400 truncate">
              &lt;{tagName}
            </span>
            {id && <span className="text-xs font-mono text-amber-300 truncate">#{id}</span>}
            {classString && <span className="text-xs font-mono text-slate-400 truncate">{classString}</span>}
            <span className="text-xs font-mono font-bold text-sky-400">&gt;</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onReinspect && (
            <button
              type="button"
              onClick={onReinspect}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-sky-300 transition-colors"
              title="Pick Another Element"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
          {!isEmbedded && (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/40 px-2 pt-1 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border-b-2 transition-colors shrink-0 ${
                isActive
                  ? 'border-sky-400 text-sky-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 max-h-[460px]">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <ElementDetails details={details} />
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                DOM Hierarchy
              </span>
              <ComponentTree
                hierarchy={domHierarchy}
                onSelectAncestor={onSelectAncestor}
              />
            </div>
          </div>
        )}

        {/* 2. STYLES TAB */}
        {activeTab === 'styles' && (
          <div className="space-y-3">
            {/* Search / Filter styles */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter computed styles..."
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
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
                <div key={categoryName} className="rounded-lg bg-slate-900/60 border border-slate-800 p-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                    {categoryName}
                  </span>
                  <div className="space-y-1 font-mono text-xs">
                    {filteredProps.map(([property, value]) => (
                      <div
                        key={property}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-slate-800/60"
                      >
                        <span className="text-sky-400">{property}:</span>
                        <span className="text-slate-200 truncate max-w-[200px]" title={String(value)}>
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
              <span className="text-xs font-semibold text-slate-300">Outer HTML Snippet</span>
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

            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all overflow-x-auto max-h-72">
              <code>{outerHTML}</code>
            </pre>
          </div>
        )}

        {/* 4. COMPONENT TAB */}
        {activeTab === 'component' && (
          <div className="space-y-3">
            {/* Framework Identification Card */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Detected Framework
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  details.framework?.includes('React')
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : details.framework?.includes('Vue')
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : details.framework?.includes('Angular')
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {details.framework || 'Vanilla HTML'}
                </span>
              </div>

              {/* Component Name */}
              {details.componentName ? (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Component Name</span>
                    <span className="text-sm font-mono font-bold text-sky-300">
                      &lt;{details.componentName} /&gt;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(details.componentName, 'comp-name')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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
                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 italic">
                  {details.framework === 'Vanilla HTML'
                    ? 'Standard DOM element (no framework component wrapper).'
                    : 'No specific component name resolved for this DOM node.'}
                </div>
              )}

              {/* Confidence Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">Detection Confidence:</span>
                <span className={`capitalize font-medium ${
                  details.confidence === 'high'
                    ? 'text-emerald-400'
                    : details.confidence === 'partial'
                    ? 'text-sky-400'
                    : 'text-amber-400'
                }`}>
                  {details.confidence || 'partial'}
                </span>
              </div>
            </div>

            {/* Component Hierarchy */}
            {details.componentHierarchy && details.componentHierarchy.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
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
                          isTarget ? 'bg-sky-500/15 text-sky-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        <span className="text-slate-600">&bull;</span>
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
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 block">File Path</span>
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950/60 border border-slate-800">
                    <code className="text-xs font-mono text-emerald-300 break-all" title={details.sourceFile}>
                      {details.sourceFile}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(details.sourceFile, 'source-file')}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
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
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Line Number</span>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {details.lineNumber ? `Line ${details.lineNumber}` : 'Unknown'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Column</span>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {details.columnNumber ? `Col ${details.columnNumber}` : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Detection Strategy */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">Strategy:</span>
                  <span className="font-mono text-slate-300 text-[11px]">
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
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target Editor:</span>
                    <span className="font-semibold text-sky-300 capitalize">{ide}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const locationStr = `${details.sourceFile}:${details.lineNumber || 1}:${details.columnNumber || 1}`;
                      copyToClipboard(locationStr, 'ide-location');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-md shadow-sky-950/50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in {ide.charAt(0).toUpperCase() + ide.slice(1)}</span>
                  </button>
                  {copiedKey === 'ide-location' && (
                    <span className="text-[11px] text-emerald-400 text-center block">
                      Target location copied for IDE launch!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-center space-y-2">
                  <FileCode className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                  <h4 className="text-xs font-semibold text-slate-200">
                    Source Location Metadata Not Available
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    This element does not have DevLocator compilation metadata or React Fiber <code className="text-amber-300 font-mono">_debugSource</code> attached.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    How to enable 1-click source jump:
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Add the DevLocator plugin to your <code className="text-sky-300 font-mono">vite.config.js</code> during development:
                  </p>
                  <pre className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-sky-300 overflow-x-auto">
                    <code>{`// vite.config.js\nimport devlocator from './integrations/vite-plugin';\n\nexport default {\n  plugins: [devlocator()],\n};`}</code>
                  </pre>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Code Editor:</span>
                  <span className="font-semibold text-sky-300 capitalize">{ide}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-3.5 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[240px]">
          Selector: <span className="font-mono text-slate-300">{selector}</span>
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

