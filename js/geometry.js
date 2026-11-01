/*
 * Browser-only navigation helpers, independent of the fractal mathematics.
 */
(function (global) {
  'use strict';
  const FracGen = global.FracGen || (global.FracGen = {});

  const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));

  function PixelToComplex(x, y, Settings) {
    return {
      x: Settings.x1 + (x / Settings.XWidth) * (Settings.x2 - Settings.x1),
      y: Settings.y2 - (y / Settings.YWidth) * (Settings.y2 - Settings.y1)
    };
  }

  /** Zoom at a cursor location while keeping the complex point under it fixed. */
  function ZoomAt(Settings, pixelX, pixelY, factor) {
    const at = PixelToComplex(pixelX, pixelY, Settings);
    const newWidth = (Settings.x2 - Settings.x1) * factor;
    const newHeight = (Settings.y2 - Settings.y1) * factor;
    const x1 = at.x - (pixelX / Settings.XWidth) * newWidth;
    const y2 = at.y + (pixelY / Settings.YWidth) * newHeight;
    return { ...Settings, x1, x2: x1 + newWidth, y1: y2 - newHeight, y2 };
  }

  /**
   * A rectangular drag in pixel coordinates; the original x/y bounds
   * are mapped independently, keeping every selection inside the view.
   */
  function ZoomToRectangle(Settings, left, top, right, bottom) {
    const a = PixelToComplex(clamp(left, 0, Settings.XWidth), clamp(top, 0, Settings.YWidth), Settings);
    const b = PixelToComplex(clamp(right, 0, Settings.XWidth), clamp(bottom, 0, Settings.YWidth), Settings);
    return {
      ...Settings,
      x1: Math.min(a.x, b.x), x2: Math.max(a.x, b.x),
      y1: Math.min(a.y, b.y), y2: Math.max(a.y, b.y)
    };
  }

  FracGen.clamp = clamp;
  FracGen.PixelToComplex = PixelToComplex;
  FracGen.ZoomAt = ZoomAt;
  FracGen.ZoomToRectangle = ZoomToRectangle;
})(globalThis);
