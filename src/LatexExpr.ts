import { Polynomial } from "./Polynomial";

export class LatexExpr {
  /* The template treats "%%t%%" as the parameter */

  constructor(
    public latexTemplate: string,
    public arg: Polynomial = new Polynomial([0, 1])
  ) {}

  applyTo(poly: Polynomial) {
    let out = new LatexExpr(this.latexTemplate);
    out.arg = this.arg.applyTo(poly);
    return out;
  }

  toLatex(parameter: string) {
    return this.latexTemplate.replace(
      /%%t%%/g,
      `(${this.arg.toLatex(parameter)})`
    );
  }
}

export class PointLatexExpr {
  constructor(public x: LatexExpr, public y: LatexExpr) {}

  applyTo(poly: Polynomial) {
    return new PointLatexExpr(this.x.applyTo(poly), this.y.applyTo(poly));
  }

  toLatex(parameter: string) {
    return `(${this.x.toLatex(parameter)},${this.y.toLatex(parameter)})`;
  }
}
