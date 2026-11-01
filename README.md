# FracGen-HTML

**A pure HTML, CSS and JavaScript port of [Riley Perry's FracGen](https://github.com/Agmash29a/FracGen), written originally in Visual Basic 6.**

![HTML only](https://img.shields.io/badge/frontend-HTML%20%2B%20CSS%20%2B%20JavaScript-6b4db0) ![No dependencies](https://img.shields.io/badge/dependencies-none-3a8170)

## Run it

**Double-click `index.html`**. It works locally in a modern browser without a web server, `npm`, Node.js, .NET, a network connection, or a build step. You can also host the files in any static host, including GitHub Pages.

## What it preserves

This is a port of the actual [FracGen VB6 source](https://github.com/Agmash29a/FracGen), *not* an unrelated Mandelbrot demonstration:

- All **five fractal sets**: `MandelbrotSet`, `JuliaSet_zSqrPlusc`, `JuliaSet_eTozPlusc`, `JuliaSet_SinzPluseTozPlusc`, `JuliaSet_ceToz`.
- All **seven original colour schemes**: `PurpleHaze`, `RhapsodyInBlue`, `JustTheSet`, `LineThroughColorSpace`, `CircleThroughColorSpace`, `Waves`, `RGBModifier`.
- Source-level names: `M`, `K`, `cx`, `cy`, `x1`, `x2`, `y1`, `y2`, `LINE_x1`, `LINE_y1`, `LINE_z1`, `LINE_x2`, `LINE_y2`, `LINE_z2`, `xc`, `yc`, `ZIndex`, `r`, `RGB_R`, `RGB_G`, `RGB_B`.
- Original defaults from `MODULE_Globals.bas`, including `M=200`, `K=100`, `cx=-0.194`, `cy=0.6557`, and a 500 × 500 image.
- The **squared-magnitude** bailout (`|z|² < M`) used in the VB6 original, rather than the standard Mandelbrot escape radius of 2.
- The original inverted Y-axis mapping from `MapPixeltoComplexNumber`.
- The original circle radius adjustment (`Settings.r + 1`) and legacy palette equations.
- Original VB6 comments such as `**** Generate Set ****`, `**** Colour pixel black if max iterations reached ****`, and `**** Determine u mapping to count ****` have been carried into the appropriate JavaScript code.

## Version 1.2 — Compact workspace

- A **full-width, viewport-fitted fractal canvas** instead of a permanently narrow image.
- An unobtrusive toolbar for fractal type, palette, presets, Render, Undo and PNG.
- All original numerical controls, colour parameters and image-resolution options in a **collapsible Parameters drawer**.
- Living background controls move into a small Background menu.
- Viewport coordinates and JSON export remain accessible under a disclosure.
- No slogans, promotional copy, oversized preset cards, or large introductory panels.
- All original FracGen computations and comments remain unchanged.

## What is new (v1.1 — ambient theme)

- White, responsive UI with an interactive fractal canvas (the image area itself uses black where the palette specifies it).
- **Living fractal wallpaper:** after every completed render, a small transparent copy of the **actual** image softly fills the white background around the canvas. Change the set, colour palette, zoom, or preset and the wallpaper follows. No second fractal calculation is needed.
- **Ambient controls:** enable/disable, adjust intensity (0–100%), and switch between soft-aura and detailed textures. All controls are instant and cosmetic; PNG output is unchanged.
- Rectangular drag-to-zoom, wheel-to-zoom, back navigation and a reset-to-original button.
- Seven viewpoint presets, including Seahorse Valley and various Julia variants.
- Responsive, scanline-based progressive rendering with a progress display and cancel button.
- PNG image export and JSON settings export.
- Pointer-coordinate readout and keyboard shortcut `R` to render.

## File layout

```text
FracGen-HTML/
├── index.html                   Accessible, semantic interface
├── styles.css                   White-background and living-fractal theme
├── compact.css                  Compact toolbar, drawer and larger image viewer
├── js/
│   ├── settings.js              VB6 constants, enums, presets
│   ├── complex-arithmetic.js    CLASS_ComplexNumber / CLASS_ComplexArithmetic
│   ├── colours.js               DrawColouredPixel and palette formulas
│   ├── mandelbrot.js            The five original fractal generators
│   ├── geometry.js              Zoom and pixel-coordinate helpers
│   ├── ambient.js               Translucent wallpaper colour treatment
│   └── app.js                   Interface, rendering, events, export
└── tests/
    └── run-tests.cjs            Dependency-free regression tests
```

The app intentionally uses **classic external `<script defer>` tags**, not ES modules. Therefore it works directly from `file://` URLs without local CORS restrictions, and the code remains readable in a basic editor. Scripts attach to one `globalThis.FracGen` namespace.

## Test

If Node.js is installed:

```sh
node tests/run-tests.cjs
```

There are no third-party test packages. The tests exercise the complex-number operations, all five fractal generators, all seven palettes, exact defaults, pixel buffer rendering, wallpaper transparency and zoom geometry.

## Limits and design notes

- Uses JavaScript double-precision numbers (`Number`), as did VB6 `Double`; extremely deep zooms eventually reach floating-point precision limits.
- Large resolutions and high iteration limits can take time. Rendering is chunked to keep the browser interactive; the operation is still CPU-bound.
- Exported PNG images are from the canvas's actual pixel buffer, not a screenshot of the page. The ambient background uses a separately processed, downscaled copy and never contaminates the export.
- This is a hand port that preserves the mathematics and comments; the Windows VB6 forms, GDI calls and binary image resources are not copied.
- No licensing terms are inferred for the original VB6 repository. This new source credits the original author and links back to the source.

## Sources and attribution

Original Visual Basic 6 application by **Riley Perry**: [Agmash29a/FracGen](https://github.com/Agmash29a/FracGen). Ported from `MODULE_Globals.bas`, `CLASS_Settings.cls`, `CLASS_ComplexNumber.cls`, `CLASS_ComplexArithmetic.cls`, `CLASS_Mandelbrot.cls`, `FORM_MainScreen.frm` and `FORM_Settings.frm`.
