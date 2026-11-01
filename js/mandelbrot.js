/*
 * FracGen — HTML/JavaScript port of CLASS_Mandelbrot.cls
 * Original Visual Basic 6: Riley Perry
 *
 * Original function names and comments have been preserved, with the
 * render loop adapted to an HTML5 Canvas pixel buffer.
 *
 * The inner loop uses scalar z.x / z.y equivalents for performance.
 * This avoids allocating a new complex object for every pixel iteration.
 */
(function (global) {
  'use strict';
  const FracGen = global.FracGen || (global.FracGen = {});
  const SetType = FracGen.ENUM_SetType;

  // **** Find difference between 2 adjacent points on complex plane ****
  function StepValue(xy1, xy2, WidthLength) {
    return (xy2 - xy1) / WidthLength;
  }

  // **** Match pixel to complex number ****
  // Original y direction: y2 - StepValuey * y (positive imaginary at top).
  function MapPixeltoComplexNumber(x, y, Settings) {
    const StepValuex = StepValue(Settings.x1, Settings.x2, Settings.XWidth);
    const StepValuey = StepValue(Settings.y1, Settings.y2, Settings.YWidth);
    return new FracGen.CLASS_ComplexNumber(
      Settings.x1 + StepValuex * x,
      Settings.y2 - StepValuey * y
    );
  }

  /**
   * Calculate escape iterations for one point in the complex plane.
   * M is |z|²'s upper bound, K the iteration limit; this preserves VB6's
   * "While ((ComplexArithmetic.Magnitude(z) ^ 2 < M) And (count < K))".
   */
  function EscapeIterations(pointReal, pointImag, Settings) {
    const { M, K, cx, cy, FractalSet } = Settings;
    const Mandelbrot = FractalSet === SetType.MandelbrotSet;

    // **** calculate c / calculate z0 ****
    const cReal = Mandelbrot ? pointReal : cx;
    const cImag = Mandelbrot ? pointImag : cy;
    let zReal = Mandelbrot ? 0 : pointReal;
    let zImag = Mandelbrot ? 0 : pointImag;

    // **** count <- 0 ****
    let count = 0;

    // **** Generate Set ****
    // for (each pixel) ... while (|z|^2 < M and count < K)
    while (zReal * zReal + zImag * zImag < M && count < K) {
      const oldReal = zReal;
      const oldImag = zImag;

      switch (FractalSet) {
        case SetType.MandelbrotSet:
        case SetType.JuliaSet_zSqrPlusc:
          // z <- z^2 + c
          zReal = oldReal * oldReal - oldImag * oldImag + cReal;
          zImag = 2 * oldReal * oldImag + cImag;
          break;

        case SetType.JuliaSet_eTozPlusc: {
          // z <- e^z + c
          const eReal = Math.exp(oldReal);
          zReal = eReal * Math.cos(oldImag) + cReal;
          zImag = eReal * Math.sin(oldImag) + cImag;
          break;
        }

        case SetType.JuliaSet_SinzPluseTozPlusc: {
          // z <- Sin(z) + e^z + c
          const eReal = Math.exp(oldReal);
          zReal = Math.sin(oldReal) * Math.cosh(oldImag) + eReal * Math.cos(oldImag) + cReal;
          zImag = Math.cos(oldReal) * Math.sinh(oldImag) + eReal * Math.sin(oldImag) + cImag;
          break;
        }

        case SetType.JuliaSet_ceToz: {
          // z <- ce^z
          const eReal = Math.exp(oldReal);
          const expReal = eReal * Math.cos(oldImag);
          const expImag = eReal * Math.sin(oldImag);
          zReal = cReal * expReal - cImag * expImag;
          zImag = cReal * expImag + cImag * expReal;
          break;
        }

        default:
          throw new RangeError('Unknown FractalSet: ' + FractalSet);
      }

      // **** count <- count + 1 ****
      count += 1;
    }
    return count;
  }

  // These public aliases retain the generator names from CLASS_Mandelbrot.cls.
  function MandelbrotGenerator(x, y, Settings) {
    return EscapeIterations(x, y, { ...Settings, FractalSet: SetType.MandelbrotSet });
  }
  function JuliaGenerator_zSqrPlusc(x, y, Settings) {
    return EscapeIterations(x, y, { ...Settings, FractalSet: SetType.JuliaSet_zSqrPlusc });
  }
  function JuliaGenerator_eToz(x, y, Settings) {
    return EscapeIterations(x, y, { ...Settings, FractalSet: SetType.JuliaSet_eTozPlusc });
  }
  function JuliaGenerator_SinzPluseToz(x, y, Settings) {
    return EscapeIterations(x, y, { ...Settings, FractalSet: SetType.JuliaSet_SinzPluseTozPlusc });
  }
  function JuliaGenerator_ceToz(x, y, Settings) {
    return EscapeIterations(x, y, { ...Settings, FractalSet: SetType.JuliaSet_ceToz });
  }

  /** Render one scanline directly into the Canvas ImageData RGBA buffer. */
  function GenerateScanline(y, ImageData, Settings) {
    const data = ImageData.data;
    const StepValuex = StepValue(Settings.x1, Settings.x2, Settings.XWidth);
    const StepValuey = StepValue(Settings.y1, Settings.y2, Settings.YWidth);
    const complexY = Settings.y2 - StepValuey * y;
    const rowStart = y * Settings.XWidth * 4;

    for (let x = 0; x < Settings.XWidth; x++) {
      const complexX = Settings.x1 + StepValuex * x;
      const count = EscapeIterations(complexX, complexY, Settings);
      const [r, g, b] = FracGen.DrawColouredPixel(count, Settings);
      const offset = rowStart + x * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }

  Object.assign(FracGen, {
    StepValue,
    MapPixeltoComplexNumber,
    EscapeIterations,
    MandelbrotGenerator,
    JuliaGenerator_zSqrPlusc,
    JuliaGenerator_eToz,
    JuliaGenerator_SinzPluseToz,
    JuliaGenerator_ceToz,
    GenerateScanline
  });
})(globalThis);
