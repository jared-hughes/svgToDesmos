import { svgToExpressions } from "./svgToExpressions";

function insertSVGAsExpressions(svg: string, normalize: boolean) {
  console.log("Processing SVG ...");
  const exprs = svgToExpressions(svg, normalize);
  console.log("Applying Expressions ...");
  (window as any).Calc.setExpressions(exprs);
  console.log("Done with inserting SVG");
}

(window as any).insertSVGAsExpressions = insertSVGAsExpressions;
