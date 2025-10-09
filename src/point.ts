export function cleanCoord(x: number) {
  const prev = x.toString();
  const next = x.toPrecision(6);
  // Desmos can't handle scientific, so just give up
  // An improvement could be golfing exponentials
  if (!next.includes("e") && next.length < prev.length) {
    return trimTrailingZeroes(next);
  }
  if (prev.includes("e")) {
    return prev.replace(/e.*/, (x) => `*10^{${x.slice(1)}}`);
  }
  return trimTrailingZeroes(prev);
}

function trimTrailingZeroes(s: string) {
  return s.replace(/[1-9]\.?0+$/, (x) => x[0]!);
}

export default class Point {
  constructor(public x = 0, public y = 0) {}

  toLatex() {
    return `(${cleanCoord(this.x)},${cleanCoord(this.y)})`;
  }

  add(p: Point) {
    return new Point(this.x + p.x, this.y + p.y);
  }

  neg() {
    return new Point(-this.x, -this.y);
  }

  sub(p: Point) {
    return this.add(p.neg());
  }

  mul(s: number) {
    return new Point(s * this.x, s * this.y);
  }

  eq(p: Point) {
    return this.x === p.x && this.y === p.y;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}
