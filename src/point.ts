function cleanCoord(x: number) {
  const prev = x.toString();
  const next = x.toPrecision(6);
  // Desmos can't handle scientific, so just give up
  // An improvement could be golfing exponentials
  if (!next.includes("e") && next.length < prev.length) {
    return next;
  }
  return prev;
}

export default class Point {
  constructor(public x = 0, public y = 0) {}

  toLatex() {
    return `\\left(${cleanCoord(this.x)},${cleanCoord(this.y)}\\right)`;
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
}
