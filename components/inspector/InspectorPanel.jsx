import React, { useState } from 'react';
import {
  Crosshair,
  X,
  Minus,
  Maximize2,
  Code,
  Sparkles,
  Info,
  Sliders,
  FileCode,
  Layers,
  Search,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Plus,
  Navigation,
} from 'lucide-react';
import ElementDetails from './ElementDetails.jsx';
import ComponentTree from './ComponentTree.jsx';
import { MESSAGE_TYPES } from '../../utils/messages.js';

/**
 * Renders the brand logo SVG for the detected frontend framework.
 */
function renderFrameworkLogo(framework) {
  const fw = (framework || '').toLowerCase();
  if (fw.includes('react')) {
    return (
      <svg
        viewBox="-11.5 -10.23174 23 20.46348"
        className="w-6 h-6 text-[#00a8ff]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
      >
        <circle cx="0" cy="0" r="2.05" fill="#00a8ff" stroke="none" />
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </svg>
    );
  }
  if (fw.includes('vue')) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M12 2L2 19.3h4.6L12 9.7l5.4 9.6H22L12 2z" fill="#42b883" />
        <path d="M12 9.7L7.8 17h8.4L12 9.7z" fill="#35495e" />
      </svg>
    );
  }
  if (fw.includes('angular')) {
    return (
      <svg viewBox="0 0 250 250" className="w-6 h-6">
        <polygon points="125,30 125,30 125,30 31.9,63.2 46.1,186.3 125,230 125,230 125,230 203.9,186.3 218.1,63.2" fill="#dd0031" />
        <polygon points="125,30 125,52.2 125,52.1 125,153.4 125,153.4 125,230 125,230 203.9,186.3 218.1,63.2" fill="#c3002f" />
        <path d="M125,52.1L66.8,182.6H88.5L100.9,152.1H149.1L161.5,182.6H183.2L125,52.1ZM141.6,134.1H108.4L125,93.8L141.6,134.1Z" fill="#ffffff" />
      </svg>
    );
  }
  return <Code className="w-5 h-5 text-[#0066ff]" />;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'styles', label: 'Styles', icon: Sliders },
  { id: 'component', label: 'Component', icon: Layers },
  { id: 'source', label: 'Source', icon: FileCode },
];

/**
 * InspectorPanel renders the in-page DevLocator panel matching the
 * modern soft-UI / iOS-inspired aesthetic with rounded cards, radial orbs,
 * and floating bottom dock navigation.
 */
export default function InspectorPanel({
  details,
  onClose,
  onReinspect,
  onSelectAncestor,
  ide = 'antigravity',
  isEmbedded = false,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [styleFilter, setStyleFilter] = useState('');
  const [openStatus, setOpenStatus] = useState(null); // { type: 'loading'|'success'|'error', text: string }

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

  // Minimized floating pill view
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[2147483647] bg-white/95 border border-slate-200/80 shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-full px-3 py-2 flex items-center gap-3 text-xs backdrop-blur-md select-none transition-all">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0066ff] shadow-[0_0_8px_rgba(0,102,255,0.6)] animate-pulse" />
          <span className="font-mono font-bold text-slate-900">
            &lt;{tagName}{idString}&gt;
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          title="Expand Inspector"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors flex items-center justify-center"
          title="Close Inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col font-sans select-none bg-[#f4f5f9] border border-white/80 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)] ${
        isEmbedded
          ? 'w-full h-full rounded-2xl'
          : 'fixed bottom-5 right-5 z-[2147483647] w-[390px] max-h-[610px] rounded-[32px] overflow-hidden'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Element Tag Pill Badge */}
          <div className="px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-xs font-mono font-bold text-[#0066ff] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#0066ff] shadow-[0_0_6px_rgba(0,102,255,0.4)]" />
            <span className="truncate max-w-[120px]">&lt;{tagName}{idString}&gt;</span>
          </div>
          {classString && (
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[100px]" title={classString}>
              {classString}
            </span>
          )}
        </div>

        {/* Top Header Control Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Navigate to Parent */}
          {details.parent && (
            <button
              type="button"
              onClick={() => onSelectAncestor?.(details.parent)}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-600 hover:text-[#0066ff] transition-all"
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
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-600 hover:text-[#0066ff] transition-all"
              title={`Inspect Child <${details.children[0].tagName}> (Down Arrow)`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {!isEmbedded && (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Circular Close Button (styled like the circular X in design reference) */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3.5 max-h-[470px]">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            {/* Hero Framework, Selector & Source Card (matches user design reference) */}
            <div
              className="rounded-3xl p-4 border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] relative overflow-hidden space-y-3"
              style={{
                background:
                  'radial-gradient(ellipse at 92% 10%, rgba(219, 234, 254, 0.55) 0%, rgba(240, 246, 255, 0.25) 45%, rgba(255, 255, 255, 1) 75%), #ffffff',
              }}
            >
              {/* Header: Framework Logo + Framework Name + Component Pill */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Neumorphic / Embossed Squircle Icon Container */}
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white to-[#edf5ff] border border-blue-100/80 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,102,255,0.08)]">
                    {renderFrameworkLogo(details.framework)}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                      Framework
                    </span>
                    <span className="text-base font-bold text-slate-900 block leading-tight mt-0.5">
                      {details.framework || 'Vanilla HTML'}
                    </span>
                  </div>
                </div>

                {/* Component Name Badge */}
                <div className="px-3.5 py-1 rounded-full bg-[#edf4ff] border border-blue-200/70 shadow-xs flex items-center">
                  <span className="text-xs font-mono font-bold text-[#0066ff]">
                    {details.componentName ? `<${details.componentName} />` : `<${tagName} />`}
                  </span>
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Selector Row */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100/90">
                  <Crosshair className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="w-14 text-xs font-bold text-slate-800 shrink-0">Selector</span>
                  <div className="flex-1 min-w-0 bg-slate-50/90 border border-slate-200/60 rounded-full px-3 py-1 flex items-center overflow-hidden">
                    <span className="text-xs font-mono text-[#0066ff] truncate" title={selector}>
                      {selector}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selector, 'hero-selector')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    title="Copy CSS Selector"
                  >
                    {copiedKey === 'hero-selector' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* 2. XPath Row */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100/90">
                  <Navigation className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="w-14 text-xs font-bold text-slate-800 shrink-0">XPath</span>
                  <div className="flex-1 min-w-0 bg-slate-50/90 border border-slate-200/60 rounded-full px-3 py-1 flex items-center overflow-hidden">
                    <span className="text-xs font-mono text-amber-600 truncate" title={details.xpath}>
                      {details.xpath}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(details.xpath, 'hero-xpath')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    title="Copy XPath"
                  >
                    {copiedKey === 'hero-xpath' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* 3. Source Row */}
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="w-14 text-xs font-bold text-slate-800 shrink-0">Source</span>
                  <div className="flex-1 min-w-0 bg-slate-50/90 border border-slate-200/60 rounded-full px-3 py-1 flex items-center overflow-hidden">
                    <span
                      className={`text-xs font-mono truncate ${details.sourceFile ? 'text-emerald-700' : 'text-slate-400 italic'}`}
                      title={
                        details.sourceFile
                          ? `${details.sourceFile}${details.lineNumber ? `:${details.lineNumber}${details.columnNumber ? `:${details.columnNumber}` : ''}` : ''}`
                          : 'No source location detected'
                      }
                    >
                      {details.sourceFile
                        ? `${details.sourceFile.split('/').slice(-2).join('/')}${details.lineNumber ? `:${details.lineNumber}` : ''}`
                        : 'Not detected'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        details.sourceFile
                          ? `${details.sourceFile}${details.lineNumber ? `:${details.lineNumber}${details.columnNumber ? `:${details.columnNumber}` : ''}` : ''}`
                          : selector,
                        'hero-source'
                      )
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    title="Copy Source File Location"
                  >
                    {copiedKey === 'hero-source' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Element Details & Children */}
            <ElementDetails details={details} onSelectChild={onSelectAncestor} />

            {/* DOM Hierarchy Section */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-800 px-1 block">
                DOM Ancestor Hierarchy
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
            {/* Search filter input in soft white pill card */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Filter computed styles..."
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-[#0066ff] transition-all font-mono"
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
                <div key={categoryName} className="rounded-2xl bg-white border border-slate-100/90 p-3.5 shadow-sm space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    {categoryName}
                  </span>
                  <div className="space-y-1 font-mono text-xs">
                    {filteredProps.map(([property, value]) => (
                      <div
                        key={property}
                        className="flex items-center justify-between py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-[#0066ff] font-medium">{property}:</span>
                        <span className="truncate max-w-[190px] text-slate-700 font-normal" title={String(value)}>
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

        {/* 3. COMPONENT TAB */}
        {activeTab === 'component' && (
          <div className="space-y-3.5">
            {/* Framework Identification Card (matching design reference) */}
            <div className="p-4 rounded-3xl bg-white border border-slate-100/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Detected Framework
                </span>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                  details.framework?.includes('React')
                    ? 'bg-blue-50 text-[#0066ff] border border-blue-200/60'
                    : details.framework?.includes('Vue')
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                    : details.framework?.includes('Angular')
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {details.framework || 'Vanilla HTML'}
                </span>
              </div>

              {/* Component Name */}
              {details.componentName ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Component Name</span>
                    <span className="text-sm font-mono font-bold text-[#0066ff]">
                      &lt;{details.componentName} /&gt;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(details.componentName, 'comp-name')}
                    className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center shrink-0"
                    title="Copy Component Name"
                  >
                    {copiedKey === 'comp-name' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 text-xs italic text-slate-400">
                  {details.framework === 'Vanilla HTML'
                    ? 'Standard DOM element (no framework component wrapper).'
                    : 'No specific component name resolved for this DOM node.'}
                </div>
              )}

              {/* Confidence Meter */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Detection Confidence:</span>
                <span className={`capitalize font-bold ${
                  details.confidence === 'high'
                    ? 'text-emerald-500'
                    : details.confidence === 'partial'
                    ? 'text-[#0066ff]'
                    : 'text-amber-500'
                }`}>
                  {details.confidence || 'partial'}
                </span>
              </div>
            </div>

            {/* Component Hierarchy Card */}
            {details.componentHierarchy && details.componentHierarchy.length > 0 && (
              <div className="p-4 rounded-3xl bg-white border border-slate-100/90 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-800 block">
                  Component Hierarchy
                </span>
                <div className="space-y-1 font-mono text-xs pt-1">
                  {details.componentHierarchy.map((comp, idx) => {
                    const isTarget = idx === details.componentHierarchy.length - 1;
                    return (
                      <div
                        key={`${comp}-${idx}`}
                        style={{ paddingLeft: `${idx * 10}px` }}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-xl ${
                          isTarget ? 'bg-blue-50 text-[#0066ff] font-bold border border-blue-100' : 'text-slate-600'
                        }`}
                      >
                        <span className="text-slate-300">&bull;</span>
                        <span>&lt;{comp} /&gt;</span>
                        {isTarget && (
                          <span className="ml-auto text-[9px] uppercase font-sans font-bold px-2 py-0.5 rounded-full bg-[#0066ff] text-white">
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

        {/* 4. SOURCE TAB */}
        {activeTab === 'source' && (
          <div className="space-y-3.5">
            {details.sourceFile ? (
              <div className="space-y-3.5">
                {/* Hero Source Card with Radial Glowing Orb */}
                <div className="p-5 rounded-3xl bg-white border border-slate-100/90 shadow-sm text-center relative overflow-hidden space-y-3">
                  {/* Radial Orb */}
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center relative shadow-[0_10px_25px_-5px_rgba(0,102,255,0.28)] border-2 border-white"
                    style={{
                      background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #e0edff 50%, #cbe1ff 100%)',
                    }}
                  >
                    <FileCode className="w-7 h-7 text-[#0066ff]" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Source Code Location</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {details.sourceVerified ? 'Verified compilation metadata' : 'Approximate debug source'}
                    </p>
                  </div>

                  {/* File Path Row */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-left">
                    <code className="text-xs font-mono text-emerald-700 break-all font-semibold" title={details.sourceFile}>
                      {details.sourceFile}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(details.sourceFile, 'source-file')}
                      className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center shrink-0 shadow-xs"
                      title="Copy File Path"
                    >
                      {copiedKey === 'source-file' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Line Number & Column Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] block uppercase font-bold text-slate-400">Line Number</span>
                      <span className="text-sm font-mono font-bold text-[#0066ff]">
                        {details.lineNumber ? `Line ${details.lineNumber}` : 'Unknown'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] block uppercase font-bold text-slate-400">Column</span>
                      <span className="text-sm font-mono font-bold text-[#0066ff]">
                        {details.columnNumber ? `Col ${details.columnNumber}` : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons (exact match of "Cancel" and "Upload" pill buttons from design image) */}
                <div className="flex items-center gap-3 pt-1">
                  {/* Secondary Pill Button */}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${details.sourceFile}:${details.lineNumber || 1}:${details.columnNumber || 1}`, 'path-loc')}
                    className="flex-1 py-3 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs transition-all shadow-xs active:scale-95 text-center flex items-center justify-center gap-1.5"
                  >
                    {copiedKey === 'path-loc' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </button>

                  {/* Primary Vibrant Blue Pill Button */}
                  <button
                    type="button"
                    disabled={openStatus?.type === 'loading'}
                    onClick={() => {
                      setOpenStatus({ type: 'loading', text: `Opening in ${ide}...` });
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
                    className="flex-1 py-3 px-4 rounded-full bg-[#0066ff] hover:bg-[#0052cc] active:scale-95 text-white font-semibold text-xs transition-all shadow-[0_6px_20px_rgba(0,102,255,0.35)] flex items-center justify-center gap-2 text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {openStatus?.type === 'loading'
                        ? 'Opening...'
                        : `Open in ${ide.charAt(0).toUpperCase() + ide.slice(1)}`}
                    </span>
                  </button>
                </div>

                {/* Status Toast Banner */}
                {openStatus && (
                  <div className={`p-2.5 rounded-2xl text-xs font-medium text-center shadow-xs ${
                    openStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : openStatus.type === 'loading'
                      ? 'bg-blue-50 text-[#0066ff] border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {openStatus.text}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm text-center space-y-3">
                <FileCode className="w-10 h-10 text-amber-500 mx-auto opacity-70" />
                <h4 className="text-xs font-bold text-slate-800">
                  Source Metadata Not Available
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  This element does not have DevLocator compilation metadata or React Fiber <code className="text-amber-600 font-mono">_debugSource</code> attached.
                </p>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
                  <span className="font-semibold text-slate-700 block">How to enable 1-click jump:</span>
                  <p className="text-[11px] text-slate-500">Add the DevLocator plugin in your <code className="text-[#0066ff] font-mono">vite.config.js</code>:</p>
                  <pre className="p-2 rounded-xl bg-white border border-slate-200 font-mono text-[10px] text-[#0066ff] overflow-x-auto">
                    <code>{`import devlocator from './integrations/vite-plugin';\nexport default { plugins: [devlocator()] };`}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Dock Bar (matching the bottom navigation bar with center + FAB in the design image) */}
      <div className="px-3 py-2 bg-white/95 backdrop-blur-md border-t border-slate-100/90 flex items-center justify-around rounded-b-[32px] relative shadow-inner">
        {/* Tab 1: Overview */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'overview'
              ? 'text-[#0066ff] font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Info className="w-4 h-4" />
          <span className="text-[10px]">Overview</span>
        </button>

        {/* Tab 2: Styles */}
        <button
          type="button"
          onClick={() => setActiveTab('styles')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'styles'
              ? 'text-[#0066ff] font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px]">Styles</span>
        </button>

        {/* Center Floating Action Button (FAB) for Re-inspecting (matches the + FAB in design image) */}
        <button
          type="button"
          onClick={onReinspect}
          className="w-11 h-11 -mt-5 rounded-full bg-white border border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.12)] flex items-center justify-center text-slate-800 hover:text-[#0066ff] hover:scale-110 active:scale-95 transition-all shrink-0 z-10"
          title="Pick Another Element"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Tab 3: Component */}
        <button
          type="button"
          onClick={() => setActiveTab('component')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'component'
              ? 'text-[#0066ff] font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px]">Component</span>
        </button>

        {/* Tab 4: Source */}
        <button
          type="button"
          onClick={() => setActiveTab('source')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all relative ${
            activeTab === 'source'
              ? 'text-[#0066ff] font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span className="text-[10px]">Source</span>
          {details.sourceFile && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-0.5 right-2" />
          )}
        </button>
      </div>
    </div>
  );
}
