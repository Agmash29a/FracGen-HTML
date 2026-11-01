/*
 * Dependency-free smoke and regression tests for the fractal maths.
 * Run: node tests/run-tests.cjs
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const sandbox = { Math, Number, RangeError };
vm.createContext(sandbox);
for (const file of ['settings.js', 'complex-arithmetic.js', 'colours.js', 'mandelbrot.js', 'geometry.js', 'ambient.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), sandbox, { filename: file });
}
const F = sandbox.FracGen;
const s = { ...F.CONSTANTS };
let tests = 0;
function check(name, fn) {
  try { fn(); console.log('✓', name); tests++; }
  catch (error) { console.error('✗', name); throw error; }
}
function close(a, b, tolerance = 1e-10) {
  assert.ok(Math.abs(a - b) < tolerance, `${a} should be ${b}`);
}
check('Original defaults preserved (M, K, c, viewport)', () => {
  assert.equal(s.M, 200); assert.equal(s.K, 100);
  assert.equal(s.cx, -0.194); assert.equal(s.cy, 0.6557);
  assert.deepEqual([s.x1, s.x2, s.y1, s.y2], [-2, 2, -2, 2]);
  assert.equal(s.r, 126);
});
check('Complex-number addition, multiplication and magnitude', () => {
  const a = new F.CLASS_ComplexNumber(2, 3);
  const b = new F.CLASS_ComplexNumber(4, -1);
  const sum = F.CLASS_ComplexArithmetic.Add(a, b);
  const product = F.CLASS_ComplexArithmetic.Multiply(a, b);
  assert.deepEqual([sum.x, sum.y], [6, 2]);
  assert.deepEqual([product.x, product.y], [11, 10]);
  close(F.CLASS_ComplexArithmetic.Magnitude(a), Math.sqrt(13));
});
check('Complex exp and sin at origin', () => {
  const origin = new F.CLASS_ComplexNumber();
  const exp = F.CLASS_ComplexArithmetic.eToz(origin);
  const sine = F.CLASS_ComplexArithmetic.SinZ(origin);
  close(exp.x, 1); close(exp.y, 0);
  close(sine.x, 0); close(sine.y, 0);
});
check('Pixel mapping respects original reversed Y-axis', () => {
  const topLeft = F.MapPixeltoComplexNumber(0, 0, s);
  assert.deepEqual([topLeft.x, topLeft.y], [-2, 2]);
  const centre = F.MapPixeltoComplexNumber(250, 250, s);
  assert.deepEqual([centre.x, centre.y], [0, 0]);
  close(F.StepValue(-2, 2, 500), .008);
});
check('Mandelbrot: zero is inside the set', () => {
  assert.equal(F.MandelbrotGenerator(0, 0, s), s.K);
  assert.ok(F.MandelbrotGenerator(2, 2, s) < s.K);
});
check('Each of five formulas produces finite bounded iteration counts', () => {
  for (let type = 0; type <= 4; type++) {
    const iterations = F.EscapeIterations(0.2, -0.3, { ...s, FractalSet: type });
    assert.ok(Number.isInteger(iterations) && iterations >= 0 && iterations <= s.K, `${type} => ${iterations}`);
  }
});
check('Julia quadratic with c=0 leaves zero fixed', () => {
  assert.equal(F.JuliaGenerator_zSqrPlusc(0, 0, { ...s, cx: 0, cy: 0 }), s.K);
});
check('Seven palette implementations keep every channel in byte range', () => {
  for (let palette = 0; palette < 7; palette++) {
    for (const count of [0, 1, 5, 51, 99]) {
      const rgb = F.DrawColouredPixel(count, { ...s, ColourScheme: palette });
      assert.equal(rgb.length, 3);
      assert.ok(rgb.every(x => Number.isInteger(x) && x >= 0 && x <= 255));
    }
  }
});
check('Interior always black, JustTheSet exterior white', () => {
  assert.deepEqual(Array.from(F.DrawColouredPixel(s.K, s)), [0, 0, 0]);
  assert.deepEqual(Array.from(F.DrawColouredPixel(5, { ...s, ColourScheme: 2 })), [255, 255, 255]);
});
check('VB6 Round uses ties-to-even', () => {
  assert.equal(F.VBRound(.5), 0); assert.equal(F.VBRound(1.5), 2);
  assert.equal(F.VBRound(2.5), 2); assert.equal(F.VBRound(3.5), 4);
});
check('Waves alternates circle and line', () => {
  const waves = { ...s, ColourScheme: 5 };
  assert.deepEqual(Array.from(F.DrawColouredPixel(2, waves)), Array.from(F.DrawColouredPixel(2, { ...s, ColourScheme: 3 })));
  assert.deepEqual(Array.from(F.DrawColouredPixel(3, waves)), Array.from(F.DrawColouredPixel(3, { ...s, ColourScheme: 4 })));
});
check('RGBModifier uses modulo 256', () => {
  assert.deepEqual(Array.from(F.DrawColouredPixel(80, { ...s, ColourScheme: 6, RGB_R: 3, RGB_G: 5, RGB_B: 7 })), [240, 144, 48]);
});
check('Pixel rendering writes 4-channel opaque image buffer', () => {
  const settings = { ...s, XWidth: 6, YWidth: 4 };
  const img = { data: new Uint8ClampedArray(6 * 4 * 4) };
  for (let y = 0; y < settings.YWidth; y++) F.GenerateScanline(y, img, settings);
  assert.equal(img.data.length, 96);
  for (let i = 3; i < img.data.length; i += 4) assert.equal(img.data[i], 255);
});
check('Ambient wallpaper hides black and preserves coloured filaments', () => {
  const img = { data: new Uint8ClampedArray([0, 0, 0, 255, 60, 10, 120, 255]) };
  F.MakeAmbientImageData(img);
  assert.equal(img.data[3], 0, 'Black pixels become transparent');
  assert.ok(img.data[4] > 60 && img.data[6] >= 120, 'Bright colours remain visible');
  assert.ok(img.data[7] > 0 && img.data[7] <= 235, 'Coloured pixels have translucency');
});
check('Cursor-anchored zoom preserves complex point under cursor', () => {
  const before = F.PixelToComplex(125, 100, s);
  const zoomed = F.ZoomAt(s, 125, 100, .4);
  const after = F.PixelToComplex(125, 100, zoomed);
  close(before.x, after.x); close(before.y, after.y);
});
check('Rectangle zoom selects the expected quadrants', () => {
  const zoomed = F.ZoomToRectangle(s, 125, 125, 375, 375);
  assert.deepEqual([zoomed.x1, zoomed.x2, zoomed.y1, zoomed.y2], [-1, 1, -1, 1]);
});
console.log(`\n${tests} tests passed.`);
