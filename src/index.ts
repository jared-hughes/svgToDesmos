import { svgToExpressions } from "./svgToExpressions";
import { insertExpressions } from "./calcHelpers";

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
  (window as any).svgToDesmosInputElement = insertSVGElement;
  insertSVGElement.addEventListener("change", async () => {
    const file = insertSVGElement.files?.[0];
    if (file === undefined) return;
    const svgString = await file.text();
    insertExpressions(svgToExpressions(svgString, file.name));
  });
}

if ((window as any).svgToDesmosInputElement === undefined) {
  injectElement();
}
