import Point from "./point";
import { epsilon, serializeFloat } from "./float";

export class Polynomial {
  // coefficients are stored as a list e.g. [1,2,5] is 1x^0+2x^2+5x^3
  constructor(public coeffs: number[]) {}

  clearLeadingZeros() {
    // mutates coeffs
    while (
      this.coeffs[this.coeffs.length - 1] !== undefined &&
      Math.abs(this.coeffs[this.coeffs.length - 1] ?? 0) < epsilon
    ) {
      this.coeffs.pop();
    }
    return this;
  }

  add(other: Polynomial) {
    const newCoeffs = [];
    for (
      let i = 0;
      i < Math.max(other.coeffs.length, this.coeffs.length);
      i++
    ) {
      newCoeffs[i] = (other.coeffs[i] ?? 0) + (this.coeffs[i] ?? 0);
    }
    return new Polynomial(newCoeffs).clearLeadingZeros();
  }

  scale(factor: number) {
    return new Polynomial(this.coeffs.map((c) => c * factor));
  }

  mulPoint(factor: Point) {
    return new PointPolynomial(this.scale(factor.x), this.scale(factor.y));
  }

  sub(other: Polynomial) {
    return this.add(other.scale(-1));
  }

  mul(other: Polynomial) {
    const newCoeffs = [
      ...Array(this.coeffs.length + other.coeffs.length - 1),
    ].map(() => 0);
    for (let i = 0; i < this.coeffs.length; i++) {
      for (let j = 0; j < other.coeffs.length; j++) {
        newCoeffs[i + j] += (this.coeffs[i] ?? 0) * (other.coeffs[j] ?? 0);
      }
    }
    return new Polynomial(newCoeffs);
  }

  applyTo(other: Polynomial) {
    // returns the result of substituting `other` for x in the polynomial
    // calculated via Horner Form
    let out = new Polynomial([this.coeffs[this.coeffs.length - 1] ?? 0]);
    for (let i = this.coeffs.length - 2; i >= 0; i--) {
      out = out.mul(other);
      out.coeffs[0] += this.coeffs[i] ?? 0;
    }
    // out.coeffs[0] += this.coeffs[0] ?? 0;
    return out;
  }

  toLatex(parameter: string, startIndex = 0): string {
    this.clearLeadingZeros();
    const degree = this.coeffs.length - 1;
    let str: string = "";
    if (degree < startIndex) {
      // should only be reached for polynomials with an empty coeffs list ([])
      return "0";
    } else if (degree === startIndex) {
      // should only be reached within degree 0 polynomials
      return serializeFloat(this.coeffs[degree] ?? 0);
    } else if (degree - 1 === startIndex) {
      // general base case, e.g. 4+5x
      str = serializeFloat(this.coeffs[degree] ?? 0) + parameter;
    } else {
      // general recursive case
      const inner = this.toLatex(parameter, startIndex + 1);
      str = `(${inner})${parameter}`;
    }
    const coeff = this.coeffs[startIndex] ?? 0;
    const coeffStr = serializeFloat(coeff);
    if (coeff > 0) {
      if (str.startsWith("-")) {
        str = coeffStr + str;
      } else {
        str += "+" + coeffStr;
      }
    } else if (coeffStr.charAt(0) === "-") {
      // "-" added by stringification of number
      str += coeffStr;
    }
    return str;
  }
}

export class PointPolynomial {
  constructor(public xPoly: Polynomial, public yPoly: Polynomial) {}

  add(other: PointPolynomial) {
    return new PointPolynomial(
      this.xPoly.add(other.xPoly),
      this.yPoly.add(other.yPoly)
    );
  }

  scale(factor: number) {
    return new PointPolynomial(
      this.xPoly.scale(factor),
      this.yPoly.scale(factor)
    );
  }

  sub(other: PointPolynomial) {
    return this.add(other.scale(-1));
  }

  mul(other: Polynomial) {
    return new PointPolynomial(this.xPoly.mul(other), this.yPoly.mul(other));
  }

  applyTo(other: Polynomial) {
    return new PointPolynomial(
      this.xPoly.applyTo(other),
      this.yPoly.applyTo(other)
    );
  }

  toLatex(parameter: string) {
    const xstr = this.xPoly.toLatex(parameter);
    const ystr = this.yPoly.toLatex(parameter);
    return `(${xstr},${ystr})`;
  }
}

/* Informal tests real quick */

/*
console.log(new Polynomial([]).toHornerLatex("t")); // 0
console.log(new Polynomial([0]).toHornerLatex("t")); // 0
console.log(new Polynomial([1]).toHornerLatex("t")); // 1
console.log(new Polynomial([0, 1]).toHornerLatex("t")); // 1t
console.log(new Polynomial([1, 2, 3]).toHornerLatex("t")); // 1+t(2+3t)
console.log(
  new Polynomial([1, 2, 3]).add(new Polynomial([-1, -2, -3])).toHornerLatex("t")
); // 0
console.log(
  new Polynomial([1, 2, 3]).mul(new Polynomial([0, 1, 1])).toHornerLatex("t")
); // t(1+t(3+t(5+3t)))
console.log(new Polynomial([1]).mul(new Polynomial([0, 1])).toHornerLatex("t")); // t
console.log(
  new Polynomial([1, 0, 1]).applyTo(new Polynomial([0, 1])).toHornerLatex("t")
); // 1+t(1t)
console.log(
  new Polynomial([1, 0, 1]).applyTo(new Polynomial([-1, 1])).toHornerLatex("t")
); // 2+t(-2+1t)
*/
