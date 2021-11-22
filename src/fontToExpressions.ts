import { pathStringToParametric } from "./pathToParametric";
import { Expression, generateId } from "./calcHelpers";
import { parse as parseFont } from "opentype.js";
import Point from "./point";

export default function fontToExpressions(
  fontBuffer: ArrayBuffer,
  str: string,
  filename: string
) {
  const font = parseFont(fontBuffer);
  const parametricBodies: { [key: number]: string } = {};
  const parametricCalls: number[] = [];
  const offsets: Point[] = [];
  const fontSize = 16;
  font.forEachGlyph(str, 0, 0, fontSize, {}, (glyph, x, y) => {
    const path = glyph.getPath(0, 0, fontSize, {
      // We want positive y going up
      // Unfortunately, yScale is not multiplied by the normal scale, so
      // we have to use some internals to get the scale
      yScale: (-1 / ((glyph.path as any).unitsPerEm || 1000)) * fontSize,
    });
    const key = glyph.index;
    if (parametricBodies[key] === undefined) {
      // Performance could be improved by directly using path.commands
      // but it's easier to just use the existing path parser
      const parametricBody = pathStringToParametric(path.toPathData(15));
      parametricBodies[key] = parametricBody;
    }
    parametricCalls.push(key);
    offsets.push(new Point(x, y));
  });
  const expressions: Expression[] = [];
  const renderFolderID = generateId();
  expressions.push({
    type: "folder",
    id: renderFolderID,
    title: `Render string:\n${str}`,
  });
  expressions.push({
    type: "expression",
    id: generateId(),
    folderId: renderFolderID,
    latex: `P_{offsets}+\\left[
        ${parametricCalls.map((key) => `f_{${key}}(t)`).join(",")}
      \\right]`,
    fill: true,
    fillOpacity: "1",
    lines: false,
    parametricDomain: { min: "", max: "0.99999" },
  });
  expressions.push({
    type: "expression",
    id: generateId(),
    folderId: renderFolderID,
    latex: `P_{offsets}=\\left[
        ${offsets.map((e) => e.toLatex()).join(",")}
      \\right]`,
    points: false,
  });
  const parametricsFolderID = generateId();
  expressions.push({
    type: "folder",
    id: parametricsFolderID,
    title:
      "Parametric glyph definitions\n\n" +
      (filename ?? "") +
      "\n\nConverted to Desmos using https://github.com/jared-hughes/svgToDesmos.",
    collapsed: true,
  });
  expressions.push(
    ...Object.entries(parametricBodies).map(([key, body]) => ({
      type: "expression",
      id: generateId(),
      folderId: parametricsFolderID,
      latex: `f_{${key}}\\left(t\\right) = ${body}`,
    }))
  );
  return expressions;
}
