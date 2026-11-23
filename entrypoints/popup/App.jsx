import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Settings,
  Code,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Keyboard,
  LogOut,
  PanelBottom,
  PanelsTopLeft,
  ShieldAlert,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import IDESettings from '../../components/settings/IDESettings.jsx';
import GeneralSettings from '../../components/settings/GeneralSettings.jsx';
import SourceSetupGuide from '../../components/settings/SourceSetupGuide.jsx';
import Toggle from '../../components/ui/Toggle.jsx';
import { getSettings, saveSettings, onSettingsChange, DEFAULT_SETTINGS } from '../../utils/storage.js';
import { MESSAGE_TYPES } from '../../utils/messages.js';
import { getProjectFolder, getProjectSite, saveProjectFolder } from '../../utils/project-folders.js';

const INSPECTOR_MODES = [
  { value: 'dock', title: 'Auto-dock', description: 'Slide into the bottom bar after 3 seconds.', icon: PanelBottom },
  { value: 'always', title: 'Keep open', description: 'Leave Overview visible after the jump.', icon: PanelsTopLeft },
  { value: 'on_failure', title: 'Show on failure', description: 'Open Overview if the jump fails.', icon: ShieldAlert },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'settings'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isInspecting, setIsInspecting] = useState(false);
  const [pageSupported, setPageSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Ready to inspect');
  const [selectedElement, setSelectedElement] = useState(null);
  const [copied, setCopied] = useState(false);
  const [projectSite, setProjectSite] = useState(null);
  const [projectFolder, setProjectFolder] = useState('');
  const [folderStatus, setFolderStatus] = useState('');

  // Load saved settings
  useEffect(() => {
    getSettings().then((loaded) => setSettings(loaded));
    return onSettingsChange(setSettings);
  }, []);

  // Check current tab inspection status & selected element
  useEffect(() => {
    async function loadProjectFolder(site) {
      try {
        setProjectFolder(await getProjectFolder(site));
        setProjectSite(site);
      } catch {
        setFolderStatus('Could not load the project folder.');
        setProjectSite(site);
      }
    }

    async function checkTabStatus() {
      try {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) return;

        const site = getProjectSite(tab.url);
        if (site) void loadProjectFolder(site);

        // Check if tab URL is inspectable (cannot inspect chrome:// or edge:// pages)
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('view-source:'))) {
          setPageSupported(false);
          setStatusMessage('Cannot inspect internal browser pages');
          return;
        }

        // Query content script status
        chrome.tabs.sendMessage(
          tab.id,
          { type: MESSAGE_TYPES.GET_INSPECTION_STATUS },
          (response) => {
            if (chrome.runtime.lastError) {
              setIsInspecting(false);
              return;
            }
            if (response && typeof response.isInspecting === 'boolean') {
              setIsInspecting(response.isInspecting);
              setStatusMessage(response.isInspecting ? 'Inspection active on this page' : 'Ready to inspect');
            }
            if (!site && response?.projectSite) void loadProjectFolder(response.projectSite);
          }
        );

        // Query last inspected element
        chrome.tabs.sendMessage(
          tab.id,
          { type: MESSAGE_TYPES.GET_SELECTED_ELEMENT },
          (response) => {
            if (!chrome.runtime.lastError && response?.details) {
              setSelectedElement(response.details);
            }
          }
        );
      } catch (err) {
        console.warn('[DevLocator] Tab check warning:', err);
      }
    }

    checkTabStatus();

    // Listen for runtime status changes
    const messageListener = (message) => {
      if (!message) return;
      if (message.type === MESSAGE_TYPES.INSPECTION_STATUS_CHANGED) {
        setIsInspecting(Boolean(message.isInspecting));
        setStatusMessage(message.isInspecting ? 'Inspection active on this page' : 'Ready to inspect');
      } else if (message.type === MESSAGE_TYPES.ELEMENT_SELECTED) {
        setSelectedElement(message.details);
      }
    };

    chrome.runtime.onMessage?.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage?.removeListener(messageListener);
    };
  }, []);

  const handleToggleInspection = async () => {
    if (!pageSupported) return;

    try {
      if (typeof chrome === 'undefined' || !chrome.tabs) return;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      const messageType = isInspecting
        ? MESSAGE_TYPES.STOP_INSPECTION
        : MESSAGE_TYPES.START_INSPECTION;

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: messageType,
          settings,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ['content-scripts/content.js'],
              },
              () => {
                chrome.tabs.sendMessage(tab.id, {
                  type: MESSAGE_TYPES.START_INSPECTION,
                  settings,
                });
                setIsInspecting(true);
                window.close();
              }
            );
            return;
          }

          setIsInspecting(!isInspecting);
          if (!isInspecting) {
            window.close();
          }
        }
      );
    } catch (err) {
      console.error('[DevLocator] Failed to toggle inspection:', err);
    }
  };

  const handleCopySelector = (selector) => {
    if (!selector) return;
    navigator.clipboard.writeText(selector).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleUpdateSettings = async (updates) => {
    const updated = await saveSettings(updates);
    setSettings(updated);
  };

  const handleSaveProjectFolder = async (event) => {
    event.preventDefault();
    const folder = projectFolder.trim();
    if (folder && !folder.startsWith('/') && !folder.startsWith('~/')) {
      setFolderStatus('Enter an absolute Linux folder path.');
      return;
    }
    try {
      await saveProjectFolder(projectSite, folder);
      setProjectFolder(folder);
      setFolderStatus(folder ? 'Project folder saved.' : 'Project folder cleared.');
    } catch {
      setFolderStatus('Could not save the project folder.');
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-slate-400">
        Loading DevLocator...
      </div>
    );
  }

  const getIdeDisplayName = (ideId) => {
    switch (ideId) {
      case 'vscode':
        return 'VS Code';
      case 'cursor':
        return 'Cursor';
      case 'antigravity':
      default:
        return 'Antigravity';
    }
  };

  return (
    <div
      data-theme={settings.theme}
      className="flex flex-col h-full select-none text-slate-900"
      style={{
        background:
          'radial-gradient(ellipse at 92% 8%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 246, 255, 0.2) 40%, rgba(248, 250, 253, 1) 75%), #f8fafd',
      }}
    >
      {/* Top Header */}
      <header className="px-4 pt-4 pb-2.5 flex items-center justify-between">
        {/* Left Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <img src="/icons/icon-128.png" alt="" className="w-9 h-9 object-contain" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              DevLocator
            </h1>
            <span className="text-[10px] font-semibold text-[#0066ff] px-2 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/60 shadow-xs">
              v0.1
            </span>
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${
              activeTab === 'inspector'
                ? 'bg-gradient-to-r from-[#0066ff] to-[#0052cc] text-white shadow-[0_4px_12px_rgba(0,102,255,0.28)]'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 shadow-xs'
            }`}
          >
            Inspect
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'settings' ? 'inspector' : 'settings')}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shadow-xs ${
              activeTab === 'settings'
                ? 'bg-[#edf5ff] border-blue-200/80 text-[#0066ff]'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-800'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="px-4 py-2 flex-1 overflow-y-auto space-y-3.5">
        {activeTab === 'inspector' ? (
          <>
            {/* 1. Status Pill Bar */}
            <div
              className={`w-full rounded-2xl px-4 py-2.5 border shadow-xs flex items-center gap-2.5 transition-colors ${
                !pageSupported
                  ? 'bg-rose-50/80 border-rose-200/80 text-rose-800'
                  : isInspecting
                  ? 'bg-blue-50/80 border-blue-200/80 text-[#0066ff]'
                  : 'bg-[#eafaf4] border-emerald-200/70 text-slate-800'
              }`}
            >
              {!pageSupported ? (
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              ) : isInspecting ? (
                <div className="w-2.5 h-2.5 rounded-full bg-[#0066ff] animate-pulse shadow-[0_0_8px_rgba(0,102,255,0.6)] shrink-0" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
              )}
              <span className="text-xs font-semibold">
                {statusMessage}
              </span>
            </div>

            {/* 2. Big Primary Action Button */}
            <button
              type="button"
              disabled={!pageSupported}
              onClick={handleToggleInspection}
              className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-[0_8px_22px_rgba(0,102,255,0.32)] flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] ${
                isInspecting
                  ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 shadow-[0_8px_20px_rgba(225,29,72,0.32)]'
                  : 'bg-gradient-to-r from-[#0080ff] via-[#0066ff] to-[#0052cc] hover:from-[#0073e6] hover:to-[#0047b3]'
              }`}
            >
              {isInspecting ? (
                <>
                  <XCircle className="w-5 h-5 text-white" />
                  <span>Stop Inspection</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/90 flex items-center justify-center">
                    <Crosshair className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Inspect Element</span>
                </>
              )}
            </button>

            {/* 3. Target Editor Card */}
            <div
              className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden flex items-center justify-between"
              style={{
                background:
                  'radial-gradient(circle at 95% 20%, rgba(219, 234, 254, 0.4) 0%, transparent 60%), #ffffff',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-white to-blue-50/80 border border-blue-100 shadow-xs flex items-center justify-center text-[#0066ff] shrink-0">
                  <Code className="w-5 h-5 text-[#0066ff]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    TARGET EDITOR
                  </span>
                  <span className="text-sm font-bold text-slate-900 block leading-tight">
                    {getIdeDisplayName(settings.ide)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-3.5 py-1.5 rounded-full bg-[#edf5ff] hover:bg-blue-100/80 border border-blue-200/60 text-xs font-bold text-[#0066ff] shadow-xs transition-colors"
              >
                Change
              </button>
            </div>

            {/* 4. Keyboard Shortcuts Reference Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-2.5">
              {/* Row 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">Hold to Inspect</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Hold</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#edf5ff] border border-blue-200/70 text-xs font-mono font-bold text-[#0066ff] shadow-xs">
                    Shift
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-100/90" />

              {/* Row 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">Exit Inspection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Release</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#edf5ff] border border-blue-200/70 text-xs font-mono font-bold text-[#0066ff] shadow-xs">
                    Shift
                  </span>
                  <span className="text-xs text-slate-400 font-sans mx-0.5">/</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#edf5ff] border border-blue-200/70 text-xs font-mono font-bold text-[#0066ff] shadow-xs">
                    Esc
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Last Inspected Element Summary (if present) */}
            {selectedElement && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066ff]">
                    Last Inspected Element
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {selectedElement.dimensions?.width} &times; {selectedElement.dimensions?.height} px
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-900 truncate">
                  &lt;{selectedElement.tagName}
                  {selectedElement.id && <span className="text-amber-500">#{selectedElement.id}</span>}
                  {selectedElement.classList?.length > 0 && (
                    <span className="text-slate-500">.{selectedElement.classList.slice(0, 2).join('.')}</span>
                  )}
                  &gt;
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="font-mono text-[11px] truncate max-w-[220px] text-[#0066ff]" title={selectedElement.selector}>
                    {selectedElement.selector}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySelector(selectedElement.selector)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Copy Selector"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Settings Tab */
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Editor
                </div>
              </div>
              <IDESettings
                selectedIde={settings.ide}
                onSelectIde={(ide) => handleUpdateSettings({ ide })}
              />
              <fieldset className="space-y-2 border-t border-slate-100 pt-2">
                <legend className="pr-2 text-xs font-semibold text-slate-900">Inspector after Shift-click</legend>
                {INSPECTOR_MODES.map(({ value, title, description, icon: Icon }) => (
                  <label key={value} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="inspector-after-jump"
                      value={value}
                      checked={(settings.inspectorAfterJump || DEFAULT_SETTINGS.inspectorAfterJump) === value}
                      onChange={() => handleUpdateSettings({ inspectorAfterJump: value })}
                      className="peer sr-only"
                    />
                    <span className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-2.5 py-2 transition-colors hover:border-blue-200 peer-checked:border-blue-300 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500">
                      <Icon className="h-4 w-4 shrink-0 text-current" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{title}</span>
                        <span className="block text-[11px] leading-snug text-slate-600">{description}</span>
                      </span>
                    </span>
                  </label>
                ))}
                {settings.inspectorAfterJump === 'on_failure' && (
                  <Toggle
                    label="Show success notification"
                    description="Confirm the source jump with a brief message."
                    checked={settings.showJumpToast}
                    onChange={(checked) => handleUpdateSettings({ showJumpToast: checked })}
                  />
                )}
              </fieldset>
            </div>

            {projectSite && (
              <form onSubmit={handleSaveProjectFolder} className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2">
                <label htmlFor="project-folder" className="block text-xs font-bold text-slate-800">Local project folder</label>
                <p className="text-[11px] text-slate-500 break-all">{projectSite === 'file://' ? 'Local file pages' : projectSite}</p>
                <div className="flex items-center gap-2">
                  <input
                    id="project-folder"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 p-2 text-xs"
                    placeholder="/home/you/projects/my-site"
                    value={projectFolder}
                    onChange={(event) => {
                      setProjectFolder(event.target.value);
                      setFolderStatus('');
                    }}
                    spellCheck={false}
                  />
                  <button type="submit" className="rounded-lg bg-[#0066ff] px-3 py-2 text-xs font-semibold text-white">Save</button>
                </div>
                {folderStatus && <p role="status" className="text-xs text-slate-600">{folderStatus}</p>}
              </form>
            )}

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                Preferences
              </div>
              <GeneralSettings
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>
            <details className="group rounded-2xl border border-slate-100 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 p-3.5 text-xs font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                <BookOpen className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="flex-1">Source jump instructions</span>
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <div className="px-2 pb-2">
                <SourceSetupGuide framework={selectedElement?.framework} sourceFile={selectedElement?.sourceFile} />
              </div>
            </details>
          </div>
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="px-4 py-2.5 border-t border-slate-100/90 flex items-center justify-between text-xs bg-white/60">
        <span className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#0066ff]" /> DevLocator Developer Tool
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200/60">
          Manifest V3
        </span>
      </footer>
    </div>
  );
}
