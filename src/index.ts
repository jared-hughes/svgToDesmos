import { svgToExpressions } from "./svgToExpressions";
import { insertExpressions, generateId } from "./calcHelpers";

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
    const file = insertSVGElement.files?.[0];
    if (file === undefined) return;
    const svgString = await file.text();
    insertExpressions([
      {
        type: "text",
        id: generateId(),
        text: file.name,
      },
      ...svgToExpressions(svgString),
    ]);
  });
}

injectElement();
