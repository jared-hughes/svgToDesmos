import { svgToExpressions } from "./svgToExpressions";
import { insertExpressions } from "./calcHelpers";
import extractText from "./extractText";

function injectElement() {
  let container = document.querySelector(
    ".dcg-header-desktop .align-right-container"
  ) as HTMLDivElement | null;
  if (container === null) {
    setTimeout(injectElement, 100);
    return;
  }
  const injectedContents = document.createElement("div");
  container.prepend(injectedContents);
  injectedContents.outerHTML = `
    <div style='display: flex; flex-direction: column; line-height: normal'>
      <div style="display: flex">
        <label for='insertSVG'> SVG: </label>
        <input id='insertSVG' type='file' accept='.svg'/>
      </div>
      <div style="display: flex">
        <input id='textToExtract' type='text'/>
        <button id='extractText'>
          Extract
        </button>
      </div>
    </div>`;
  attachToInsertSVGElement(
    document.getElementById("insertSVG") as HTMLInputElement
  );
  attachToExtractTextButton(
    document.getElementById("extractText") as HTMLButtonElement
  );
  container.style.display = "flex";
}

function attachToInsertSVGElement(insertSVGElement: HTMLInputElement) {
  (window as any).svgToDesmosInputElement = insertSVGElement;
  insertSVGElement.addEventListener("change", async () => {
    const file = insertSVGElement.files?.[0];
    if (file === undefined) return;
    const svgString = await file.text();
    insertExpressions(svgToExpressions(svgString, file.name));
  });
}

function attachToExtractTextButton(extractTextButton: HTMLButtonElement) {
  extractTextButton.addEventListener("click", () => {
    const text = (document.getElementById("textToExtract") as HTMLInputElement)
      .value;
    extractText(text);
  });
}

if ((window as any).svgToDesmosInputElement === undefined) {
  injectElement();
}
