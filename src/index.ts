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
    <div style='display: flex; flex-direction: column; line-height: normal; margin-right: 1em;'>
      <label>
        <input type="checkbox" id='input-mode' />
        Font/SVG
      </label>
    </div>
  `;
  const inputModeCheckbox = document.getElementById(
    "input-mode"
  ) as HTMLInputElement;
  inputModeCheckbox.addEventListener("change", (ev) => {
    let [on, off] = ["font-insert", "svg-insert"];
    if (inputModeCheckbox.checked) {
      [on, off] = [off, on];
    }
    const onDiv = document.getElementById(on);
    if (onDiv) onDiv.style.display = "flex";
    const offDiv = document.getElementById(off);
    if (offDiv) offDiv.style.display = "none";
  });
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
        <input id='textToExtract' type='text'/>
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
    const text = textInput.value;
    insertExpressions(fontToExpressions(fontBuffer, text, file.name));
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
