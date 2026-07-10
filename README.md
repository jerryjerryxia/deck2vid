# Deck2Vid — Studio (UI prototype)

A clickable **UI prototype** for Deck2Vid, a tool that turns a slide deck or article into a video.

> ⚠️ **Prototype only.** This is a front-end walkthrough of the workflow. It makes **no network or AI calls** — every result is a placeholder to illustrate the experience. Nothing is uploaded, parsed, or rendered for real.

## The workflow

1. **Intake** — drop a deck/article (only the filename is used) or pick a sample source.
2. **Comprehend** — the source is turned into a scene-by-scene flow you can reorder and edit.
3. **Studio** — the editing hub: scene rail, live preview, timeline, and an inspector for script / avatar / voice / scene — plus a **Director** chat panel to make changes by asking.
4. **Generate** — renders a preview of the finished video.
5. **Export** — pick format/quality and download.

## Running locally

No build step, no dependencies. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Stack

Plain HTML/CSS/JS (zero dependencies). Fonts: Fraunces · Schibsted Grotesk · JetBrains Mono.
