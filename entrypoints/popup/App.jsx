import React, { useState, useEffect } from 'react';
import { Crosshair, Settings, Code, Sparkles, CheckCircle2, AlertCircle, XCircle, Tag, Copy, Check } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import SectionTitle from '../../components/ui/SectionTitle.jsx';
import IDESettings from '../../components/settings/IDESettings.jsx';
import GeneralSettings from '../../components/settings/GeneralSettings.jsx';
import { getSettings, saveSettings } from '../../utils/storage.js';
import { MESSAGE_TYPES } from '../../utils/messages.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'settings'
  const [settings, setSettings] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [pageSupported, setPageSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Ready to inspect');
  const [selectedElement, setSelectedElement] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load saved settings
  useEffect(() => {
    getSettings().then((loaded) => setSettings(loaded));
  }, []);

  // Check current tab inspection status & selected element
  useEffect(() => {
    async function checkTabStatus() {
      try {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) return;

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

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-slate-400">
        Loading DevLocator...
      </div>
    );
  }

  const isLight = settings.theme === 'light';

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
    <div className={`flex flex-col h-full select-none ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Top Header */}
      <header className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur ${
        isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h1 className={`text-sm font-bold tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              DevLocator
              <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded ${
                isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>v0.1</span>
            </h1>
          </div>
        </div>

        {/* Tab switch between Inspector & Settings */}
        <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
          isLight ? 'bg-slate-200/90 border-slate-300' : 'bg-slate-800/80 border-slate-700/60'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'inspector'
                ? 'bg-sky-500 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inspect
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`p-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'settings'
                ? 'bg-sky-500 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="p-4 flex-1 overflow-y-auto space-y-4">
        {activeTab === 'inspector' ? (
          <>
            {/* Status Card */}
            <div className={`p-3 rounded-lg border transition-colors ${
              !pageSupported
                ? isLight
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-amber-950/20 border-amber-800/50'
                : isInspecting
                ? isLight
                  ? 'bg-sky-50 border-sky-300'
                  : 'bg-sky-950/30 border-sky-800/50'
                : isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                {!pageSupported ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : isInspecting ? (
                  <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 animate-pulse" />
                ) : (
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isLight ? 'bg-slate-400' : 'bg-slate-500'}`} />
                )}
                <span className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {statusMessage}
                </span>
              </div>
              {!pageSupported && (
                <p className={`text-[11px] mt-1 pl-6 ${isLight ? 'text-amber-700' : 'text-amber-300/80'}`}>
                  Navigate to any standard http/https webpage or localhost to inspect components.
                </p>
              )}
            </div>

            {/* Primary Action Button */}
            <Button
              size="lg"
              variant={isInspecting ? 'danger' : 'primary'}
              icon={isInspecting ? XCircle : Crosshair}
              disabled={!pageSupported}
              onClick={handleToggleInspection}
              className="w-full text-center shadow-md py-3"
            >
              {isInspecting ? 'Stop Inspection' : 'Inspect Element'}
            </Button>

            {/* Selected Element Summary if present */}
            {selectedElement && (
              <div className={`p-3 rounded-lg border space-y-2 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                    Inspected Element
                  </span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedElement.dimensions?.width} &times; {selectedElement.dimensions?.height}px
                  </span>
                </div>
                <div className={`font-mono text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  &lt;{selectedElement.tagName}
                  {selectedElement.id && <span className="text-amber-500">#{selectedElement.id}</span>}
                  {selectedElement.classList?.length > 0 && (
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>.{selectedElement.classList.slice(0, 2).join('.')}</span>
                  )}
                  &gt;
                </div>
                <div className={`flex items-center justify-between text-xs pt-1 border-t ${
                  isLight ? 'border-slate-100' : 'border-slate-800'
                }`}>
                  <span className={`font-mono text-[11px] truncate max-w-[220px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`} title={selectedElement.selector}>
                    {selectedElement.selector}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySelector(selectedElement.selector)}
                    className={`p-1 rounded transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800' : 'hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Copy Selector"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Configured Editor Banner */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-500" />
                <div>
                  <div className={`text-[11px] uppercase font-semibold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Target Editor
                  </div>
                  <div className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {getIdeDisplayName(settings.ide)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="text-xs text-sky-500 hover:text-sky-600 font-medium hover:underline"
              >
                Change
              </button>
            </div>

            {/* Quick Instructions & Keyboard Shortcut */}
            <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className={`flex items-center justify-between text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span>Hold to Inspect</span>
                <kbd className={`px-1.5 py-0.5 text-[11px] font-mono rounded border ${
                  isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 text-sky-300 border-slate-700'
                }`}>
                  Hold Shift
                </kbd>
              </div>
              <div className={`flex items-center justify-between text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span>Exit Inspection</span>
                <kbd className={`px-1.5 py-0.5 text-[11px] font-mono rounded border ${
                  isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  Release Shift / Esc
                </kbd>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Settings Tab */}
            <SectionTitle
              title="Preferred Editor"
              subtitle="Choose which editor opens detected source files"
            />
            <IDESettings
              selectedIde={settings.ide}
              onSelectIde={(ide) => handleUpdateSettings({ ide })}
            />

            <div className="pt-2">
              <SectionTitle
                title="Inspector Preferences"
                subtitle="Customize overlay and behavior"
              />
              <GeneralSettings
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${
        isLight ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-950/80 border-slate-800/80 text-slate-500'
      }`}>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-500" /> DevLocator Developer Tool
        </span>
        <span>Manifest V3</span>
      </footer>
    </div>
  );
}
