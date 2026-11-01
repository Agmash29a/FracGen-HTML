/*
 * Port of CLASS_ComplexNumber.cls / CLASS_ComplexArithmetic.cls.
 *
 * The method names and variable names (z1, z2, dummy) deliberately
 * reflect Riley Perry's VB6 originals.
 */
(function (global) {
  'use strict';
  const FracGen = global.FracGen || (global.FracGen = {});

  class CLASS_ComplexNumber {
    constructor(x = 0, y = 0) {
      this.x = x; // real part
      this.y = y; // imaginary part
    }
  }

  class CLASS_ComplexArithmetic {
    // **** Multiply the 2 numbers ****
    static Multiply(z1, z2) {
      return new CLASS_ComplexNumber(
        z1.x * z2.x - z1.y * z2.y,
        z1.x * z2.y + z2.x * z1.y
      );
    }

    // **** Calculate the Magnitude ****
    static Magnitude(z) {
      return Math.sqrt(z.x * z.x + z.y * z.y);
    }

    // **** Add the 2 numbers ****
    static Add(z1, z2) {
      return new CLASS_ComplexNumber(z1.x + z2.x, z1.y + z2.y);
    }

    // **** Calculate e^z ****
    // e^(a + bi) = e^a*cos(b) + i*e^a*sin(b)
    static eToz(z) {
      const exponent = Math.exp(z.x);
      return new CLASS_ComplexNumber(
        exponent * Math.cos(z.y),
        exponent * Math.sin(z.y)
      );
    }

    static DegToRad(Degrees) {
      return Degrees / 180 * Math.PI;
    }

    // **** Calculate Sin(z) ****
    // sin(a+bi) = sin(a)cosh(b) + i*cos(a)sinh(b)
    static SinZ(z) {
      return new CLASS_ComplexNumber(
        Math.sin(z.x) * Math.cosh(z.y),
        Math.cos(z.x) * Math.sinh(z.y)
      );
    }
  }

  FracGen.CLASS_ComplexNumber = CLASS_ComplexNumber;
  FracGen.CLASS_ComplexArithmetic = CLASS_ComplexArithmetic;
})(globalThis);
