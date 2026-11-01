/*
 * Port of CLASS_Mandelbrot.DrawColouredPixel().
 *
 * The VB6 palette names, formulas and comments have been retained.
 * We output RGBA values instead of calling Windows GDI SetPixelV().
 */
(function (global) {
  'use strict';
  const FracGen = global.FracGen || (global.FracGen = {});
  const Scheme = FracGen.ENUM_ColourScheme;

  // Visual Basic's Round uses banker's rounding (ties to even).
  function VBRound(value) {
    const floor = Math.floor(value);
    const fraction = value - floor;
    if (Math.abs(fraction - 0.5) < 1e-10) {
      return (floor % 2 === 0) ? floor : floor + 1;
    }
    return Math.round(value);
  }

  function Byte(value) {
    return Math.max(0, Math.min(255, VBRound(value)));
  }

  function LineThroughColorSpace(count, Settings) {
    // **** Determine u mapping to count ****
    // Original VB6: u = count / (K / 255) / 255
    const u = count / Settings.K;

    // **** determine x, y, and z values ****
    // x = x1 + (x2 - x1)u (likewise for y and z)
    const LINE_x = Settings.LINE_x1 + (Settings.LINE_x2 - Settings.LINE_x1) * u;
    const LINE_y = Settings.LINE_y1 + (Settings.LINE_y2 - Settings.LINE_y1) * u;
    const LINE_z = Settings.LINE_z1 + (Settings.LINE_z2 - Settings.LINE_z1) * u;
    return [Byte(LINE_x), Byte(LINE_y), Byte(LINE_z)];
  }

  function CircleThroughColorSpace(count, Settings) {
    // **** determine x and y values, (1 / K) is stepsize ****
    const theta = (count / Settings.K) * 2 * Math.PI;
    // FORM_MainScreen.frm uses MySet.r = Settings.r + 1.
    const r = Settings.r + 1;
    const CIRCLE_x = Math.abs(Settings.xc + r * Math.cos(theta));
    const CIRCLE_y = Math.abs(Settings.yc + r * Math.sin(theta));
    return [Byte(CIRCLE_x), Byte(CIRCLE_y), Byte(Settings.ZIndex)];
  }

  function DrawColouredPixel(count, Settings) {
    // **** Colour pixel black if max iterations reached ****
    if (count === Settings.K) return [0, 0, 0];

    switch (Settings.ColourScheme) {
      case Scheme.PurpleHaze:
        // **** "Deep" purple colour scheme ****
        return [Byte((count % 100) * 1.5), Byte((count % 100) * 0.5), Byte((count % 100) * 2.5)];

      case Scheme.RhapsodyInBlue:
        // **** "Deep" blue colour scheme ****
        return [0, 0, Byte((count % 100) * 2.5)];

      case Scheme.JustTheSet:
        // **** White - do nothing **** (VB6 drew on a white picture box)
        return [255, 255, 255];

      case Scheme.LineThroughColorSpace:
        return LineThroughColorSpace(count, Settings);

      case Scheme.CircleThroughColorSpace:
        return CircleThroughColorSpace(count, Settings);

      case Scheme.Waves:
        // **** alternate between circle and line ****
        if ((count % 2) === 1 && count < Settings.K / 2) {
          return CircleThroughColorSpace(count, Settings);
        }
        return LineThroughColorSpace(count, Settings);

      case Scheme.RGBModifier:
        // **** Modify count value by a multiplier ****
        return [
          (count * Settings.RGB_R) % 256,
          (count * Settings.RGB_G) % 256,
          (count * Settings.RGB_B) % 256
        ];

      default:
        throw new RangeError('Unknown ColourScheme: ' + Settings.ColourScheme);
    }
  }

  function ColourSwatch(Settings) {
    const samples = [];
    for (let i = 1; i < 14; i++) {
      const count = Math.max(0, Math.min(Settings.K - 1, Math.floor(i * Settings.K / 14)));
      const [r, g, b] = DrawColouredPixel(count, Settings);
      samples.push(`rgb(${r}, ${g}, ${b})`);
    }
    return `linear-gradient(90deg, ${samples.join(', ')})`;
  }

  FracGen.VBRound = VBRound;
  FracGen.DrawColouredPixel = DrawColouredPixel;
  FracGen.ColourSwatch = ColourSwatch;
})(globalThis);
