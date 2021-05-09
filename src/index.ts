import { svgToExpressions } from "./svgToExpressions";

function insertSVGAsExpressions(svg: string, normalize: boolean) {
  console.log("Processing SVG ...");
  const exprs = svgToExpressions(svg, normalize);
  console.log("Applying Expressions ...");
  (window as any).Calc.setExpressions(exprs);
  console.log("Done with inserting SVG");
}

function injectElement() {
  const addExpressionContainer = document.querySelector(
    ".dcg-add-expression-container"
  );
  if (addExpressionContainer === null) return;
  addExpressionContainer.insertAdjacentHTML(
    "afterend",
    "<input id='insertSVG' type='file' accept='.svg'/>"
  );
  const insertSVGElement = document.getElementById(
    "insertSVG"
  ) as HTMLInputElement;
  insertSVGElement.addEventListener("change", async () => {
    const svgString = await insertSVGElement.files?.[0]?.text();
    if (svgString === undefined) return;
    insertSVGAsExpressions(svgString, true);
  });
}

injectElement();
