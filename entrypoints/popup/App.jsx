import React, { useState, useEffect } from 'react';
import { Crosshair, Settings, Code, Sparkles, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
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

  // Load saved settings
  useEffect(() => {
    getSettings().then((loaded) => setSettings(loaded));
  }, []);

  // Check current tab inspection status
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
              // Content script might not be injected yet or page is still loading
              setIsInspecting(false);
              return;
            }
            if (response && typeof response.isInspecting === 'boolean') {
              setIsInspecting(response.isInspecting);
              setStatusMessage(response.isInspecting ? 'Inspection active on this page' : 'Ready to inspect');
            }
          }
        );
      } catch (err) {
        console.warn('[DevLocator] Tab check warning:', err);
      }
    }

    checkTabStatus();
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
            // If content script wasn't loaded (e.g. tab opened before extension installed)
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ['content-scripts/content.js'],
              },
              () => {
                // Retry sending message after script injection
                chrome.tabs.sendMessage(tab.id, {
                  type: MESSAGE_TYPES.START_INSPECTION,
                  settings,
                });
                setIsInspecting(true);
                window.close(); // Close popup so user can click elements on webpage
              }
            );
            return;
          }

          setIsInspecting(!isInspecting);
          if (!isInspecting) {
            // Close popup so user immediately has full view of website
            window.close();
          }
        }
      );
    } catch (err) {
      console.error('[DevLocator] Failed to toggle inspection:', err);
    }
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
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              DevLocator
              <span className="text-[10px] font-normal px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">v0.1</span>
            </h1>
          </div>
        </div>

        {/* Tab switch between Inspector & Settings */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'inspector'
                ? 'bg-sky-500 text-white shadow-sm'
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
                ? 'bg-amber-950/20 border-amber-800/50'
                : isInspecting
                ? 'bg-sky-950/30 border-sky-800/50'
                : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                {!pageSupported ? (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : isInspecting ? (
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                )}
                <span className="text-xs font-medium text-slate-200">
                  {statusMessage}
                </span>
              </div>
              {!pageSupported && (
                <p className="text-[11px] text-amber-300/80 mt-1 pl-6">
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

            {/* Configured Editor Banner */}
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                    Target Editor
                  </div>
                  <div className="text-xs font-medium text-slate-200">
                    {getIdeDisplayName(settings.ide)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium hover:underline"
              >
                Change
              </button>
            </div>

            {/* Quick Instructions & Keyboard Shortcut */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Keyboard Toggle</span>
                <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 text-sky-300 rounded border border-slate-700">
                  {settings.shortcut || 'Alt+Shift+X'}
                </kbd>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Cancel Inspection</span>
                <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                  Esc
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
      <footer className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-500" /> DevLocator Developer Tool
        </span>
        <span>Manifest V3</span>
      </footer>
    </div>
  );
}
