# DevLocator project context

## 1. Project overview

DevLocator 0.1.0 is a Chrome developer extension for answering two questions about a rendered element. Which component owns it, and where can I edit it? Element inspection runs in the browser. Source discovery depends on what the inspected page exposes. Opening a source location adds an optional Linux desktop integration. A separate Vite plugin can supply precise JSX locations during development.

This review covers the current working tree, including existing UI edits. Findings come from the first-party source, manifests, fixtures and unit tests. Installed packages, generated WXT files, build outputs and generated icon contents were excluded. The verification scope is recorded in section 15.

## 2. Technology stack

| Layer | Verified implementation |
| --- | --- |
| Extension UI | JavaScript ES modules, JSX, React and React DOM 18, Lucide React icons, browser DOM and Clipboard APIs |
| State | React hooks for view state, content-script variables and class instances for page state, Chrome local storage for preferences |
| Styling | Tailwind CSS 3, PostCSS and Autoprefixer. Separate popup CSS, Shadow DOM panel CSS and imperative overlay styles |
| Extension runtime and build | WXT 0.19 series, its React module, Vite-based bundling, Chrome runtime, tabs, commands, scripting, storage and native messaging APIs |
| Optional project integration | ESM Vite plugin, Babel parser with JSX and TypeScript syntax support, MagicString and Node path utilities |
| Desktop and tooling | Python 3 standard library host and test, Bash installer, Node assertions and hand-built DOM mocks, npm scripts and lockfile |

React runs DevLocator's own views. React/Next.js, Vue, Angular and plain HTML are inspection targets. The extension does not depend on Next.js, Vue or Angular to render its UI. No HTTP client, server framework, database driver, ORM, router, form library or external state store appears in the application manifests or runtime flow.

## 3. Folder structure

| Path | Responsibility |
| --- | --- |
| `entrypoints/popup/` | `index.html` declares the fixed-size popup and root, `main.jsx` mounts it, `App.jsx` coordinates the active tab and preferences, `popup.css` supplies document styles |
| `entrypoints/{background.js,content.js,bridge.content.js}` | Service worker, isolated inspection controller, and main-world bootstrap respectively |
| `components/inspector/` | `InspectorPanel`, `ElementDetails` and `ComponentTree` render inspection results. `ElementPicker.jsx` is a separate React control, distinct from the active event-handling class |
| `components/settings/`, `components/ui/` | General and IDE settings views, plus Toggle, Button, SectionTitle and ErrorBoundary |
| `modules/element-inspector/` | Picker lifecycle, highlighter geometry and tooltip, DOM snapshot extraction and bridge request |
| `modules/framework-detector/` | Detection dispatcher, React, Vue, Angular and vanilla adapters, and page-world bridge |
| `modules/source-locator/`, `modules/ide-integration/` | Source metadata parsing and precedence, editor identifiers, launch validation and dispatch |
| `utils/` | Settings persistence, message constants and type guard, short text helpers |
| `integrations/vite-plugin/` | Independently declared package, transform entry point and consumer setup README |
| `native-companion/` | Python stdio host, example host manifest and Linux registration script |
| `assets/`, `public/icons/` | Panel stylesheet and packaged toolbar icons |
| `samples/`, `test-page.html` | Sample index with React, Vue, Angular-marker and vanilla pages, plus a standalone inspection fixture |
| `scripts/` | Node unit suite, Python host validation suite, Python PNG icon generator |
| Repository root | `wxt.config.js` owns manifest settings and output directory. Tailwind/PostCSS configs own CSS processing. Package files declare scripts and dependencies. README covers installation and usage |

## 4. Application architecture

The popup, service worker, isolated content script and main-world bridge run in different execution contexts. Opening the popup creates a fresh React root. The popup queries the active tab to reconstruct picker state and the last selection. Closing it leaves the content script in control of the inspection session.

1. WXT registers the bridge for matching pages at document start. It probes the page, writes a framework marker when detection succeeds and listens for inspection requests. If the initial probe finds nothing, it observes DOM changes for up to four seconds.
2. The isolated entry runs at document idle, reads settings, registers input and message listeners and checks for the bridge-ready marker. If absent it attempts to inject the packaged bridge script. Both content entries declare `<all_urls>` matches.
3. A popup action, the extension command or a held Shift key starts the picker. The picker passes a selected DOM element and extracted snapshot to the content controller. Only this controller retains the live element reference.
4. The controller mounts the panel in an open shadow root, stores the latest details in page memory and sends a selection event to the extension. Navigating the hierarchy extracts a fresh snapshot. Opening a file is a separate user action routed through the worker.

There are no URL routes, shared application shell or HTTP middleware. Navigation consists of conditional React views. WXT entry declarations and Chrome event dispatch determine which code executes.

## 5. Frontend architecture

| Surface | Owner and data flow |
| --- | --- |
| Toolbar popup | `App` owns Inspector/Settings navigation, settings, inspection status, page eligibility, last selection and copy feedback. Mount effects load storage, query the active tab and subscribe to runtime events. Starting inspection closes the popup. |
| Settings | `GeneralSettings` and `IDESettings` receive values and callbacks. Buttons, a toggle, a text field, swatches and a range input write partial settings immediately. The popup updates from the save result. There is no submit step. |
| On-page inspector | `InspectorPanel` receives details, editor choice and close, re-inspect and navigation callbacks. It owns Overview/Styles/Component/Source navigation, minimization, style filtering, copy feedback and launch status. `ElementDetails` renders DOM facts and box model. `ComponentTree` presents hierarchy entries. |
| Hover overlay | Imperative DOM elements provide the outline, fill, tooltip and exit banner. Mouse movement is coalesced with requestAnimationFrame. Scroll and resize refresh geometry. UI markers exclude DevLocator controls from normal hit testing. |

The popup mounts under React StrictMode with a local error boundary. The panel uses the shared class error boundary. Content CSS is bundled as text and inserted into the shadow root. Tailwind scans entrypoints and components. Directly mounted page overlays use inline styles. Settings start with defaults while storage loads. Launching an editor disables its action and shows inline progress followed by success or failure. Copy actions show temporary feedback.

## 6. Backend architecture

The privileged application logic lives in `entrypoints/background.js` and the optional native companion. There is no deployed backend, controller/service/model hierarchy or server-side data access in this project. The worker listens for installation, shortcut and runtime events. For an editor request it hands the payload to `ide-connector.js` and keeps the response channel open for the asynchronous result.

The Python host reads UTF-8 JSON framed by a four-byte little-endian length on stdin and writes framed replies on stdout. It ends its read loop on invalid framing or unreadable JSON and caps an incoming message at 10 MiB. Validly framed requests undergo payload validation, editor selection, path expansion and executable discovery. Launch uses an argument list and a detached process. Lookup includes desktop files, PATH and known Linux paths, then tries xdg-open. Success indicates process creation. It does not confirm the editor displayed the intended file.

## 7. Database and data lifetime

The only persistent application record found is `devlocator_settings` in `chrome.storage.local`. There are no tables, migrations, ORM models, user records or stored inspection history.

| Field | Default | Role |
| --- | --- | --- |
| ide | antigravity | Editor choice, also supports vscode and cursor |
| theme | dark | Saved appearance preference, with a rendering limitation in section 14 |
| highlightColor | #38bdf8 | Overlay outline and basis for fill |
| showTooltip | true | Show element label and dimensions |
| fillOpacity | 0.15 | Fill transparency |
| activationMode | hold_shift | Manual mode disables hold-to-inspect |
| shortcut | Hold Shift | Display preference updated with activation mode. The actual extension command is declared in WXT config. |

`getSettings` overlays stored fields on defaults. `saveSettings` reads, merges and replaces the settings object. `onSettingsChange` listens to local-area updates and reapplies defaults. A content script keeps its picker, last snapshot, live selection, pointer position and Shift state in memory for its document. The popup may retrieve that snapshot on reopening. The worker does not persist it.

## 8. API structure

Contracts here are inter-context messages. The first column uses the keys exported from `utils/messages.js`, whose wire values have the `DEVLOCATOR_` prefix.

| Message | Direction and contract |
| --- | --- |
| GET_INSPECTION_STATUS | Popup or command handler → active tab. Returns isInspecting and hasSelectedElement. The worker separately answers a runtime message of this type with a status acknowledgement. |
| GET_SELECTED_ELEMENT | Popup → active tab. Returns details, initially null. |
| START_INSPECTION / STOP_INSPECTION | Popup or command handler → active tab. Start can carry settings. Content replies with success and the resulting inspection flag. Both callers have a script-injection path when the tab fails to respond. |
| ELEMENT_SELECTED / INSPECTION_STATUS_CHANGED | Content → extension runtime. The popup consumes selection details or the inspection flag. |
| OPEN_SOURCE_IN_IDE | Panel → worker. Payload contains file, line, column and ide. Connector returns success, method and message, optionally cliCommand. |

**Page bridge.** The isolated script temporarily marks the selected element and posts INSPECT_ELEMENT with a request ID and selector. The main world resolves the marker, selector or body, then replies with INSPECT_RESULT and frameworkInfo. The listener removes the marker and resolves on reply or after 75 ms. A missing reply or a vanilla result triggers local detection.

**Native transport.** The connector calls Chrome native messaging with the validated location. The host replies with success and a message or error. The connector also implements browser URL dispatch when a window exists, then a manual CLI fallback. The normal worker caller has no window. On failure the panel attempts to copy the source location and displays the returned message.

## 9. Authentication and authorization

There is no sign-in, session, token exchange or role-based access control. Chrome grants the extension its declared storage, activeTab, scripting and nativeMessaging capabilities. Content-script matches and browser restrictions determine eligible pages. The popup explicitly checks chrome, extension and view-source URL prefixes. The shortcut handler has a narrower prefix check.

The Linux installer generates a host registration with one allowed extension origin and an absolute path to the Python script. It supports an extension-ID override and targets user-level Chrome, Chromium and Brave locations. Browser registration controls access to native messaging. JavaScript and Python also validate editor requests and allowlist editor choices. Page-supplied metadata remains untrusted even when the inspector labels a source “verified.”

## 10. Coding conventions

- React view files use PascalCase JSX filenames and default exports. Parents coordinate behavior through props and callbacks. Local hooks manage interaction state and effects register external listeners.
- Domain modules generally use kebab-case JavaScript filenames, named exports, camelCase functions, uppercase constants and JSDoc for contracts. Picker and highlighter are classes with explicit mount/start and stop/destroy lifecycles. Python uses snake_case.
- Message types and storage defaults are centralized. Browser integrations mix Promise APIs with callbacks that check chrome.runtime.lastError. Missing metadata is generally represented by null, an empty collection or a confidence field.
- Styling combines Tailwind utility classes, custom CSS, inline styles and Lucide icons. Views use explicit conditional rendering for missing data. Error handling varies between render boundaries, console diagnostics, fallback objects and inline action feedback.

## 11. Modules and business rules

| Capability | Implementation and rules |
| --- | --- |
| Activate and select | Manual popup and Alt+Shift+X command toggle the tab picker. Hold Shift respects manual mode, editable inputs and DevLocator UI. Release or blur ends a Shift-started session. Capture listeners suppress normal page clicks while selecting. Click or Enter selects, arrows move to parent, child or sibling, Escape or Exit cancels. Hit testing descends into open shadow roots. |
| Inspect DOM | element-details.js extracts selector, XPath, attributes, geometry, computed style groups, box model, DOM ancestry, parent, up to 12 direct children, 150 characters of text and cloned subtree HTML. Selection details are a point-in-time snapshot. The panel can filter styles by property or value and navigate using the supplied selectors. |
| Detect components | detect-framework.js tries React, Vue, Angular, then vanilla. React follows Fiber return links, component names and development debug source, and identifies Next.js markers. Vue checks Vue 2/3 instances and scoped attributes, walks component parents and reads file metadata. Angular reads view-encapsulation markers, ng-version and optional page debug utilities. It can infer names from host tags and supplies no source location itself. Vanilla identifies DOM tags and custom elements. |
| Resolve source | find-source.js first reads DevLocator attributes from the element or within a ten-element ancestor walk, then React debug source, then Vue file information. Paths are normalized for webpack prefixes, leading ./ and query strings. The extractor fills missing information from framework detection. Missing positions remain nullable until editor launch. The optional approximate strategy returns a candidate script URL only when requested. Normal inspection does not enable it or consume source maps. |
| Instrument consumer code | The Vite plugin runs before other transforms during serve. It accepts JSX, TSX and JS by default, skips dependency, virtual and query-bearing IDs, parses opening JSX elements and inserts file, one-based line/column and tag-derived component metadata. It returns transformed code with a high-resolution map. Parse failures skip the file. Custom JSX components must propagate metadata for it to reach DOM elements. |
| Open in editor | The Source view sends a file and defaults missing coordinates to one. The connector validates fields and normalizes the editor. Python performs its own checks, then opens the location with the selected IDE. VS Code, Cursor and Antigravity have distinct executable searches. Antigravity can fall back to Code. File existence and project membership are not prerequisites in the host. |
| Apply preferences | Popup controls → saveSettings → local storage → content-script storage listener. The listener updates the active highlighter and remounts an open panel with the latest settings. IDE selection affects the next launch. |

## 12. Reusable components and utilities

Use `Toggle` for settings switches, `ElementDetails` for the DOM details view, and `ComponentTree` for hierarchy presentation. `components/ui/ErrorBoundary.jsx` provides a recoverable panel rendering fallback. Button, SectionTitle and the React ElementPicker control also exist, but the live input controller is `modules/element-inspector/element-picker.js`.

Use `utils/storage.js` for preference defaults, reads, updates and subscriptions, and `utils/messages.js` for extension message names. `source-metadata.js` provides attribute extraction and path formatting. `ide-settings.js` owns protocol/CLI formatting and preferred-editor helpers. `utils/helpers.js` contains truncate and capitalize. These utilities have narrower responsibilities than the entrypoints that coordinate them.

## 13. Important dependencies and integration boundaries

- Root runtime dependencies are react, react-dom and lucide-react. Root development dependencies are wxt, @wxt-dev/module-react, tailwindcss, postcss and autoprefixer. Each has a corresponding runtime or build use. The root npm scripts provide dev, build, zip and test.
- The separate Vite plugin declares @babel/parser and magic-string and a Vite peer range spanning majors 4, 5 and 6. Installing the extension alone does not instrument an inspected application.
- The desktop companion uses the Python standard library. Actual launching depends on local browser registration, installed editors or a registered desktop protocol handler. The installer points to the script in its existing checkout.
- React and Vue sample pages load development libraries from a CDN. The React sample also loads browser Babel. The Angular fixture uses static markup representing Angular attributes. These fixtures exercise different levels of framework fidelity.

## 14. Known technical issues

These findings follow from specific implementation paths. User impact under a particular browser, page or editor installation requires separate runtime verification.

| Area | Finding and consequence |
| --- | --- |
| Page data in the overlay | ElementHighlighter.renderTooltip interpolates page-controlled IDs and class names into innerHTML. Rendering those values as text would preserve the label without interpreting page input as markup. |
| Bridge and source trust | The bridge uses wildcard postMessage, string markers and request correlation. DOM metadata and bridge results can be influenced by the inspected page. The verified flag expresses discovery of metadata, not filesystem verification. Native validation limits executable choices but does not confine files to a configured workspace. |
| Relative source paths | The plugin emits paths relative to its process directory. The host resolves them against its own working directory. No project-root mapping crosses the message boundary, so a correct JSX location can open the wrong local path. |
| Selection identity | Selectors prefer raw IDs or short tag/class combinations. They can be invalid CSS or match multiple nodes. Panel navigation falls back to document.querySelector, including for children. The bridge also searches the document, so elements found inside shadow roots can be misidentified. |
| Inspection cost and privacy | Each selection deep-clones and serializes the entire subtree, stores the HTML in the snapshot, logs the details and sends them through the runtime. The text preview and child list have caps, but subtree HTML has none. Selecting a large or sensitive subtree increases work and data exposure. |
| Preferences and UI state | Concurrent read/merge/write saves can overwrite each other. Storage errors return a plausible settings object, leaving persistence failures invisible to callers. The content controller passes theme, but InspectorPanel does not consume it. The popup computes isLight without using it. Remounting the panel on updates also resets its tab and filter. |
| Detection accuracy | Page-wide markers and adapter ordering can attribute an element on a mixed-framework page to the wrong framework. When the bridge alone supplies a file, the extractor labels the strategy react-debug-source even for Vue. |
| Status and error handling | The popup runtime listener does not filter by sender tab. Injection callbacks can report activation without confirming the retry. Clipboard rejection is unhandled in several actions, and editor failure feedback claims the location was copied before completion. Native or protocol dispatch success cannot establish that a file opened. |
| Maintainability | Popup and worker duplicate tab-toggle/injection logic with differing page checks. IDE choices are repeated in settings, connector helpers and Python. Popup sizing is repeated in HTML and CSS. The popup has its own render boundary. InspectorPanel contains repeated navigation and copy controls alongside launch logic. |
| Plugin contract | The plugin documents an exclude option but reads only include. It computes relative paths without enforcing project containment. Transform errors return null without diagnostics. Consumer configuration mistakes can therefore look like missing source information. |

## 15. Guidelines for future changes and verification

- Start from the owning execution context. Keep UI decisions in the appropriate React root, page interaction in the isolated content script, framework-internal reads in the main world and desktop operations behind the worker/host boundary.
- For a new inspection field, trace extraction, bridge fallback, snapshot assembly and its UI consumer. Preserve nullable metadata and distinguish a guessed framework or source from a known location. Keep non-serializable DOM and framework objects inside their owning context.
- For a new preference, extend DEFAULT_SETTINGS, route writes through saveSettings and verify both startup loading and live updates. For an editor change, check the selection view, connector, native host and failure feedback together.
- For behavior that depends on Chrome, exercise popup, shortcut and Shift activation separately. Use sample pages for manual inspection and real framework projects for metadata that fixtures simulate. For source navigation, check both an absolute debug path and a project-relative plugin path.

**Checks performed.** The Node suite passed all 11 mocked adapter, dispatcher and source-location tests. The Python suite passed all four host payload validation tests, run with bytecode writing disabled. These suites are the two components of the root test script.

**Verification limits.** This review did not build or load the extension, install the native host, start a consumer Vite server or launch an editor. The existing suites do not exercise the popup, real cross-world messaging, plugin transformation, native stdio exchange or desktop dispatch end to end. Browser and framework version compatibility, local editor registration and successful navigation on this machine remain unverified.
