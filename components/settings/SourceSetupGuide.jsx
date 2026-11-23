import React, { useId, useRef, useState } from 'react';
import { Check, ChevronDown, Layers } from 'lucide-react';
import {
  getSourceSetupGuide,
  SOURCE_SETUP_GUIDES,
} from '../../modules/source-locator/setup-guides.js';

export default function SourceSetupGuide({ framework, sourceFile, isLaunchError = false }) {
  const id = useId();
  const [selection, setSelection] = useState('');
  const picker = useRef(null);
  const trigger = useRef(null);
  const guideId = selection || getSourceSetupGuide(framework, sourceFile);
  const guide = SOURCE_SETUP_GUIDES[guideId];
  const example = guide.example || `<button data-devlocator-file="${guide.file}"
        data-devlocator-line="42">Checkout</button>`;

  function closePicker() {
    picker.current.open = false;
    trigger.current.focus();
  }

  function handlePickerKey(event) {
    if (!picker.current.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closePicker();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const options = Array.from(picker.current.querySelectorAll('button'));
    const index = options.indexOf(event.target);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const next = index < 0 && direction < 0 ? options.length - 1 : (index + direction + options.length) % options.length;
    options[next]?.focus();
  }

  return (
    <section aria-labelledby={id} className="rounded-2xl border border-slate-100 bg-white p-3.5 text-xs shadow-sm space-y-3">
      <h3 id={id} className="font-bold text-slate-900">Source jump setup</h3>
      <details open={isLaunchError || undefined} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
        <summary className="cursor-pointer font-semibold text-slate-800">Connect your editor and project</summary>
        <ol className="mt-2 ml-4 list-decimal space-y-2 leading-relaxed text-slate-600">
          <li>
            Open a terminal in the DevLocator checkout and install or update the Linux companion, then reload the extension.
            <code className="mt-1 block select-text break-all text-slate-800">bash native-companion/install.sh</code>
          </li>
          <li>Open your development page and choose an installed editor in DevLocator Settings.</li>
          <li>Open a terminal in the project root, run <code className="select-text">pwd</code>, and save that path under Local project folder.</li>
          <li>Refresh the page and Shift-click an element to try the source jump.</li>
        </ol>
      </details>
      <div className="space-y-2">
        <p id={`${id}-stack`} className="font-semibold text-slate-800">Framework or technology</p>
        <details
          ref={picker}
          className="group/framework rounded-xl border border-slate-200 bg-white open:border-blue-200 open:shadow-sm"
          onKeyDown={handlePickerKey}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
          }}
        >
          <summary ref={trigger} aria-labelledby={`${id}-stack ${id}-value`} className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-blue-500 [&::-webkit-details-marker]:hidden">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
            <span id={`${id}-value`} className="min-w-0 flex-1">{guide.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open/framework:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto overscroll-contain border-t border-slate-100 p-1.5">
            {Object.entries(SOURCE_SETUP_GUIDES).map(([key, item]) => (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={key === guideId}
                  onClick={() => {
                    setSelection(key);
                    closePicker();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-50 focus-visible:outline-blue-500 aria-pressed:bg-blue-50 aria-pressed:font-semibold aria-pressed:text-blue-700"
                >
                  <span className="flex-1">{item.label}</span>
                  {key === guideId && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </details>
        <ol className="ml-4 list-decimal space-y-1.5 leading-relaxed text-slate-600">
          {guide.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>
      {guide.plugin && (
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-800 select-text">
          <code>{guide.plugin}</code>
        </pre>
      )}
      <div className="space-y-1.5">
        <h4 className="font-semibold text-slate-800">{guide.plugin ? 'Set an exact line manually' : 'Set the exact file and line'}</h4>
        <p className="leading-relaxed text-slate-600">
          Use the example during development. Replace the file and line with your own. Use a path relative to the saved project folder or an absolute local path.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-800 select-text">
          <code>{example}</code>
        </pre>
      </div>
    </section>
  );
}
