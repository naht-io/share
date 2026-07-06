---
name: verify
description: Build, run, and drive this app to verify changes end-to-end at the browser surface.
---

# Verifying changes in this repo

## Build & launch

```bash
bun install
bun run dev   # dev server at http://localhost:5173 (ready in ~5s)
```

No database setup needed for the editor flow — the index page (`/`) renders the
tiptap editor directly.

## Driving the UI

Use Playwright with the pre-installed Chromium (`executablePath:
"/opt/pw-browsers/chromium"`). Run scripts with `bun script.mjs`.

- Editor surface: `.ProseMirror` on `/`. Click it, `page.keyboard.type(...)`.
- Bubble menu: appears on non-empty selection while the editor has focus.
  Select with keyboard (`Shift+Home`) so focus stays in the editor, then wait
  for `page.getByRole("toolbar")` and give the debounced position update
  ~600ms to settle before measuring.
- Mobile behavior: emulate with `devices["Pixel 7"]` — this makes
  `(pointer: coarse)` match, which the editor uses to reposition the bubble
  menu below the selection.
- Selection rect for position assertions:
  `window.getSelection().getRangeAt(0).getBoundingClientRect()`.

## Gotchas

- Don't use mouse-drag selection on the mobile-emulated context; keyboard
  selection is reliable and keeps `view.hasFocus()` true (required by the
  bubble menu's `shouldShow`).
