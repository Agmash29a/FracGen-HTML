/*
 * FracGen — ambient wallpaper colour treatment
 *
 * The source fractal is the only source of artwork: no generated assets,
 * duplicate fractal algorithm or external image service is needed.
 *
 * Port terminology deliberately matches the original:
 * DrawColouredPixel(), count, ColourScheme, XWidth and YWidth.
 */
(function (global) {
  'use strict';

  const F = global.FracGen = global.FracGen || {};

  /**
   * **** Colour pixel black if max iterations reached ****
   *
   * This is a *display-only* colour treatment: the exported fractal canvas
   * and the original palette equations are never changed. Making near-black
   * pixels transparent exposes white surfaces; saturated fractal filaments
   * remain visible in the surrounding theme.
   *
   * @param {ImageData} imageData A small, separate copy of the fractal canvas.
   * @returns {ImageData} The same ImageData with a transparent background.
   */
  F.MakeAmbientImageData = function MakeAmbientImageData(imageData) {
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const red = pixels[i];
      const green = pixels[i + 1];
      const blue = pixels[i + 2];
      const peak = Math.max(red, green, blue);

      if (peak <= 6) {
        pixels[i + 3] = 0;
        continue;
      }

      // Only the wallpaper is brightened. The original DrawColouredPixel()
      // output, canvas pixels and SaveImage() PNG remain unchanged.
      const brightness = Math.min(1, (peak - 6) / 115);
      const gain = Math.min(3.0, 220 / Math.max(peak, 1));
      pixels[i] = Math.min(255, red * gain);
      pixels[i + 1] = Math.min(255, green * gain);
      pixels[i + 2] = Math.min(255, blue * gain);
      pixels[i + 3] = Math.round(235 * Math.pow(brightness, 0.74));
    }

    return imageData;
  };
})(globalThis);
