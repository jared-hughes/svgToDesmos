import { Polynomial } from "./Polynomial";

export default class LatexExpr {
  /* The template treats "%%t%%" as the parameter */
  arg: Polynomial;

  constructor(public latexTemplate: string) {
    this.arg = new Polynomial([0, 1]);
  }

  applyTo(poly: Polynomial) {
    let out = new LatexExpr(this.latexTemplate);
    console.log(
      this.arg.toLatex("t"),
      poly.toLatex("t"),
      this.arg.applyTo(poly).toLatex("t")
    );
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
