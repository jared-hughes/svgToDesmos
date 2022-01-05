import { pathStringToParametric } from "./pathToParametric";
import { Expression, generateId } from "./calcHelpers";
import { parse as parseFont, Font, PathCommand } from "opentype.js";
import Point from "./point";
import pathCommandsToList from "./pathCommandsToList";
import { insertExpressions } from "./calcHelpers";

function fontToExpressionsPolygonJoin(
  font: Font,
  fontSize: number,
  spec: string,
  filename: string
) {
  /*
  The purpose of list/polygon join is to reduce the number of sample points necessary for a good picture
  by determining the sample count and positions at compile time. This especially helps for polylines
  with sharp corners, where you would otherwise have to hope that sample points land near vertices.

  This is currently just intended for my Desmos in Desmos project, which needs individual access to each
  glyph, so I have also added `spec` to determine variable assignments etc. 

  spec should be a string obeying the following grammar in pseudo-BNF
    root = line_list
    # whitespace allowed in line_list to account for newline spacing
    line_list = line | line ";" \s* line_list
    # note no whitepace around "="
    line = subscript "=" string
    subscript = [a-zA-Z0-9]+
    # semicolons cannot be represented. Oh well
    string = [^;]+

  As an example:
    carat=^;
    sin=sin
  This will compile to the following expressions:
    L_{carat}=[...] // represents the glyph "^"
    W_{carat}=8 // or whatever the width of "^" is in the font
    L_{sin}=[...] // represents the glyph "s", followed by "i", followed by "n", all offset correctly
    W_{sin}=28 // or whatever the width of "sin" is in the font
  Widths are calculated assuming that the character after the string is ";"
  Here, "Width" refers to the advance-x of the entire string.
  Re-use of glyphs between expressions is not yet included.
  Folder wrapping is not yet included.
  */
  const lines = spec.split(/;\s*/g).map((line) => line.split("="));
  const expressions: Expression[] = [];
  expressions.push({
    type: "text",
    id: "svgToDesmos_list_spec",
    text:
      "Converted to Desmos using https://github.com/jared-hughes/svgToDesmos. Spec:\n\npolygon;\n" +
      lines.map((line) => line.join("=")).join(";\n"),
  });
  for (const line of lines) {
    if (line.length !== 2) throw "Line missing equals sign";
    const [subscript, str] = line as [string, string];
    const commands: PathCommand[] = [];
    let xAdvance: number = 0;
    font.forEachGlyph(str + ";", 0, 0, fontSize, {}, (glyph, x, y) => {
      if (glyph.name !== "semicolon") {
        const path = glyph.getPath(x, 0, fontSize, {
          // We want positive y going up
          // Unfortunately, yScale is not multiplied by the normal scale, so
          // we have to use some internals to get the scale
          yScale: (-1 / ((glyph.path as any).unitsPerEm || 1000)) * fontSize,
        });
        commands.push(...path.commands);
      } else {
        // This is the last glyph ("."), so just mark its x coordinate as the width
        xAdvance = x;
      }
    });
    expressions.push({
      type: "expression",
      id: `L_${subscript}`,
      points: false,
      latex: `L_{${subscript}}=${pathCommandsToList(commands)}`,
    });
    expressions.push({
      type: "expression",
      id: `W_${subscript}`,
      latex: `W_{${subscript}}=${xAdvance.toFixed(4)}`,
    });
  }
  return expressions;
}

export default function fontToExpressions(
  fontBuffer: ArrayBuffer,
  str: string,
  filename: string
) {
  const font = parseFont(fontBuffer);
  const fontSize = 16;
  if (str.startsWith("polygon;")) {
    /* Temporarily detect polygon mode by the presence of "polygon" at the start*/
    return fontToExpressionsPolygonJoin(
      font,
      fontSize,
      str.substring("polygon;".length),
      filename
    );
  }
  const parametricBodies: { [key: number]: string } = {};
  const parametricCalls: number[] = [];
  const offsets: Point[] = [];
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
