/*
 * FracGen — settings and presets
 *
 * Names and original constant values are from Riley Perry's VB6 files:
 * MODULE_Globals.bas, CLASS_Settings.cls and FORM_MainScreen.frm.
 *
 * We retain x1/x2/y1/y2, M, K, cx/cy, LINE_* and RGB_* so that
 * the old code and this port can be compared side by side.
 */
(function (global) {
  'use strict';

  const FracGen = global.FracGen || (global.FracGen = {});

  const ENUM_SetType = Object.freeze({
    MandelbrotSet: 0,
    JuliaSet_zSqrPlusc: 1,
    JuliaSet_eTozPlusc: 2,
    JuliaSet_SinzPluseTozPlusc: 3,
    JuliaSet_ceToz: 4
  });

  const ENUM_ColourScheme = Object.freeze({
    PurpleHaze: 0,
    RhapsodyInBlue: 1,
    JustTheSet: 2,
    LineThroughColorSpace: 3,
    CircleThroughColorSpace: 4,
    Waves: 5,
    RGBModifier: 6
  });

  // **** Constants (default values) ****
  // Mirrors MODULE_Globals.bas. M is squared-magnitude bailout, NOT radius.
  const CONSTANTS = Object.freeze({
    M: 200,
    MAX_M: 1999,
    K: 100,
    cx: -0.194,
    cy: 0.6557,
    x1: -2,
    x2: 2,
    y1: -2,
    y2: 2,
    FractalSet: ENUM_SetType.MandelbrotSet,
    ColourScheme: ENUM_ColourScheme.PurpleHaze,
    XWidth: 500,
    YWidth: 500,
    LINE_x1: 0, LINE_y1: 0, LINE_z1: 0,
    LINE_x2: 255, LINE_y2: 255, LINE_z2: 255,
    xc: 127, yc: 127, ZIndex: 127,
    r: 126,                     // original: radius - 1
    RGB_R: 1, RGB_G: 1, RGB_B: 1
  });

  const SET_TYPES = Object.freeze([
    { value: 0, label: 'Mandelbrot', formula: 'z² + c · z₀ = 0' },
    { value: 1, label: 'Julia · Quadratic', formula: 'z² + c' },
    { value: 2, label: 'Julia · Exponential', formula: 'eᶻ + c' },
    { value: 3, label: 'Julia · Sine & exponential', formula: 'sin(z) + eᶻ + c' },
    { value: 4, label: 'Julia · Product exponential', formula: 'ceᶻ' }
  ]);

  const SCHEMES = Object.freeze([
    'Purple Haze',
    'Rhapsody in Blue',
    'Just the Set',
    'Line Through Colour Space',
    'Circle Through Colour Space',
    'Waves',
    'RGB Modifier'
  ]);

  // New viewpoints only; formulas, RGB calculations and original defaults stay intact.
  const PRESETS = Object.freeze([
    { name: 'Original', subtitle: 'The classic view', colour: '#6451a5',
      settings: { ...CONSTANTS } },
    { name: 'Seahorse Valley', subtitle: 'Intricate boundary', colour: '#3f80af',
      settings: { FractalSet: 0, x1: -0.82, x2: -0.70, y1: 0.02, y2: 0.14, M: 200, K: 280, ColourScheme: 0 } },
    { name: 'Elephant Valley', subtitle: 'The eastern edge', colour: '#ca794d',
      settings: { FractalSet: 0, x1: 0.20, x2: 0.40, y1: -0.10, y2: 0.10, M: 200, K: 200, ColourScheme: 3 } },
    { name: 'Julia Spirals', subtitle: 'A beautiful orbit', colour: '#5f7bce',
      settings: { FractalSet: 1, cx: -0.194, cy: 0.6557, x1: -1.8, x2: 1.8, y1: -1.8, y2: 1.8, M: 200, K: 140, ColourScheme: 1 } },
    { name: 'Exponential', subtitle: 'Complex exponentials', colour: '#b98a54',
      settings: { FractalSet: 2, x1: -2.2, x2: 2.2, y1: -2.2, y2: 2.2, cx: -0.194, cy: 0.6557, M: 200, K: 100, ColourScheme: 5 } },
    { name: 'Sine & eᶻ', subtitle: 'Transcendental set', colour: '#668b81',
      settings: { FractalSet: 3, x1: -2.4, x2: 2.4, y1: -2.4, y2: 2.4, M: 200, K: 100, ColourScheme: 4 } },
    { name: 'Product', subtitle: 'c · eᶻ', colour: '#ba6895',
      settings: { FractalSet: 4, x1: -2.4, x2: 2.4, y1: -2.4, y2: 2.4, M: 200, K: 100, ColourScheme: 6, RGB_R: 3, RGB_G: 7, RGB_B: 11 } }
  ]);

  FracGen.ENUM_SetType = ENUM_SetType;
  FracGen.ENUM_ColourScheme = ENUM_ColourScheme;
  FracGen.CONSTANTS = CONSTANTS;
  FracGen.SET_TYPES = SET_TYPES;
  FracGen.SCHEMES = SCHEMES;
  FracGen.PRESETS = PRESETS;
})(globalThis);
