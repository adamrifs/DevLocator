# DevLocator Chrome Web Store release review

Review draft for version 0.1.0. This document records source inspection and local checks. A Google review or store approval has not occurred.

## Package and images

- Package: `dist/devlocator-0.1.0-chrome.zip`, generated using `npm run zip`.
- The 128 × 128 extension icon is included in the package.
- Two 1280 × 800 screenshots in `release/store-images` show the actual extension on a local demonstration page. The inspected element has explicit development source metadata.
- Google requires an icon and at least one screenshot. Its image documentation lists promotional tiles as optional.
- Poppins font files and the logo are bundled. Confirm distribution rights for the exact font and logo before publishing.

## Privacy and permission review

- The extension registers content scripts on all URLs. Explain why broad page access is needed for inspecting the user's chosen page and review whether narrower or optional access can meet the product's needs.
- `storage` stores settings and per-site project-folder mappings.
- `activeTab` and `scripting` support active-tab inspection and content-script injection.
- `nativeMessaging` connects to the local companion for project search and editor launch.
- Chrome's host-access prompts, Web Store privacy declarations, privacy policy, and any in-product disclosure must accurately describe the released behavior. Google requires disclosures for locally processed user data.
- The popup, content scripts and native companion were searched for remote transmission. No developer analytics endpoint or remote data transmission was identified. Recheck the final build and any future dependencies before certifying.
- `release/privacy-policy-draft.md` needs publisher contact information and review before publication.

## Verification performed

- `npm test`: 13 JavaScript tests and 11 native companion tests passed.
- `npm run zip`: successful.
- Isolated Chrome session: inspected a demo element and captured the real extension overlay and inspector in the screenshots.
- Isolated Chrome profile with the built extension and Linux companion: Shift-click resolved the demo file and sent the expected file, line, and column to a stub VS Code command.
- Existing native tests exercise source matching and editor command construction with a mocked editor. They do not prove a real external editor opened.

## Remaining before a public launch

- Publish the reviewed privacy policy at a public URL and enter it in the Web Store dashboard.
- Complete accurate data-handling and permission declarations and review any applicable in-product disclosure or consent requirements.
- Verify the Web Store item ID against the companion's allowed origin. The current installer defaults to `ijpfnklnedappeonjbbkcplejdbmofke`.
- Distribute and document the existing Linux companion if releasing IDE integration before a graphical installer exists.
- Test the store-generated extension package together with the companion and real editors on a separate machine or clean user profile, including failure cases and browser variants.
- Review screenshot content, listing text, branding, license rights, and Google policy compliance. Google approval is not guaranteed.
