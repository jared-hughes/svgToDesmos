import svgToExpressions from "./svgToExpressions";
import { insertExpressions } from "./calcHelpers";
import fontToExpressions from "./fontToExpressions";

function injectElement() {
  let container = document.querySelector(
    ".align-center-container"
  ) as HTMLDivElement | null;

  if (container === null) {
    setTimeout(injectElement, 100);
    return;
  }
  container.innerHTML = "";
  container.style.display = "flex";
  injectInsertFont(container);
  injectInsertSVG(container);
  injectCheckbox(container);
}

function injectCheckbox(container: HTMLDivElement) {
  const checkboxDiv = document.createElement("div");
  container.prepend(checkboxDiv);
  checkboxDiv.outerHTML = `
    <div style='display: flex; flex-direction: column; flex-wrap: wrap; line-height: normal; margin-right: 1em;'>
      <label>
        <input type="checkbox" id='input-mode' />
        Font/SVG
      </label>
      <label id='polygon-toggle-label'>
        <input type="checkbox" id='polygon-toggle' />
        Polygon
      </label>
      <label id='widths-toggle-label'>
        <input type="checkbox" id='widths-toggle' />
        Widths
      </label>
      <label id='polygon-tolerance-label' style="display: none">
        <input type="number" id='polygon-tolerance' value='0.03' min=0.001 max=1 step=0.01 style="width: 3em"/>
        Tolerance
      </label>
    </div>
  `;
  const inputModeCheckbox = document.getElementById(
    "input-mode"
  ) as HTMLInputElement;
  inputModeCheckbox.addEventListener("change", () => {
    let [on, off] = ["font-insert", "svg-insert"];
    if (inputModeCheckbox.checked) {
      [on, off] = [off, on];
    }
    document.getElementById("polygon-toggle-label")!.style.display =
      inputModeCheckbox.checked ? "none" : "block";
    document.getElementById("widths-toggle-label")!.style.display =
      inputModeCheckbox.checked ? "none" : "block";
    const onDiv = document.getElementById(on);
    if (onDiv) onDiv.style.display = "flex";
    const offDiv = document.getElementById(off);
    if (offDiv) offDiv.style.display = "none";
  });
  const polygonCheckbox = document.getElementById(
    "polygon-toggle"
  ) as HTMLInputElement;
  polygonCheckbox.addEventListener("change", () => {
    document.getElementById("polygon-tolerance-label")!.style.display =
      polygonCheckbox.checked ? "" : "none";
  });
}

function doPolygon(): boolean {
  return !!(document.getElementById("polygon-toggle") as HTMLInputElement)
    ?.checked;
}

function doWidths(): boolean {
  return !!(document.getElementById("widths-toggle") as HTMLInputElement)
    ?.checked;
}

function injectInsertFont(container: HTMLDivElement) {
  const ttfInsertDiv = document.createElement("div");
  container.prepend(ttfInsertDiv);
  ttfInsertDiv.outerHTML = `
    <div style='display: flex; flex-direction: column; line-height: normal' id='font-insert'>
      <div style="display: flex">
        <label for='fontFileInput'> Font: </label>
        <input
          id='fontFileInput'
          type='file'
          accept='.ttf,font/ttf,.woff,font/woff,.otf,font/otf'
        />
      </div>
      <div style="display: flex">
        <input id='textToExtract' type='text' placeholder="Text to Extract"/>
        <button id='extractTextButton' style="color: black">
          Extract text
        </button>
      </div>
    </div>`;
  const button = document.getElementById("extractTextButton");
  const textInput = document.getElementById(
    "textToExtract"
  ) as HTMLInputElement;
  const fontInput = document.getElementById(
    "fontFileInput"
  ) as HTMLInputElement;
  (button as HTMLButtonElement).addEventListener("click", async () => {
    const file = fontInput.files?.[0];
    if (file === undefined) return;
    const fontBuffer = await file.arrayBuffer();
    const text = textInput.value || textInput.placeholder;
    insertExpressions(
      fontToExpressions(fontBuffer, text, file.name, doPolygon(), doWidths())
    );
  });
}

function injectInsertSVG(container: HTMLDivElement) {
  const svgInsertDiv = document.createElement("div");
  container.prepend(svgInsertDiv);
  svgInsertDiv.outerHTML = `
    <div style='display: none; flex-direction: column; line-height: normal' id='svg-insert'>
      <div style="display: flex">
        <label for='svgFileInput'> SVG: </label>
        <input id='svgFileInput' type='file' accept='.svg'/>
      </div>
      <div style="display: flex">
        <button id='insertSVGButton' style="color: black">
          Insert SVG
        </button>
      </div>
    </div>`;
  const button = document.getElementById("insertSVGButton");
  const svgInput = document.getElementById("svgFileInput") as HTMLInputElement;
  (button as HTMLButtonElement).addEventListener("click", async () => {
    const file = svgInput.files?.[0];
    if (file === undefined) return;
    const svgString = await file.text();
    insertExpressions(svgToExpressions(svgString, file.name));
  });
}

if ((window as any).svgToDesmosInputElement === undefined) {
  injectElement();
}
