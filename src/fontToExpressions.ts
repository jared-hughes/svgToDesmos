import { pathStringToParametric } from "./pathToParametric";
import { Expression, generateId } from "./calcHelpers";
import { parse as parseFont, Font, PathCommand, Glyph } from "opentype.js";
import Point, { cleanCoord } from "./point";
import pathCommandsToList from "./pathCommandsToList";

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
  const lines = spec.split(/;\s*/g).map((line): [string, string] => {
    const i = line.indexOf("=");
    if (i === -1) throw "Line missing equals sign";
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  });
  const expressions: Expression[] = [];
  expressions.push({
    type: "text",
    id: "svgToDesmos_list_spec",
    text:
      "Converted to Desmos using https://github.com/jared-hughes/svgToDesmos. Spec:\n\npolygon;\n" +
      lines.map((line) => line.join("=")).join(";\n"),
  });
  for (const line of lines) {
    let [subscript, str] = line;
    let points = true;
    let width = true;
    if (subscript.startsWith("LW_")) {
      subscript = subscript.slice(3);
    } else if (subscript.startsWith("L_")) {
      subscript = subscript.slice(2);
      width = false;
    } else if (subscript.startsWith("W_")) {
      subscript = subscript.slice(2);
      points = false;
    }
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
    if (points)
      expressions.push({
        type: "expression",
        id: `L_${subscript}`,
        points: false,
        latex: `L_{${subscript}}=${pathCommandsToList(commands)}`,
      });
    if (width)
      expressions.push({
        type: "expression",
        id: `W_${subscript}`,
        latex: `W_{${subscript}}=${xAdvance.toFixed(4)}`,
      });
  }
  return expressions;
}

function getKey(glyph: Glyph) {
  if (glyph.name && /^[a-zA-Z0-9]+$/.test(glyph.name)) {
    if (/^[0-9]+$/.test(glyph.name)) {
      return "digit" + glyph.name;
    }
    return glyph.name;
  } else {
    return glyph.index.toString();
  }
}

export default function fontToExpressions(
  fontBuffer: ArrayBuffer,
  str: string,
  filename: string,
  doPolygon: boolean,
  doWidths: boolean
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
  const parametricBodies: { [key: string]: string } = {};
  const widths: { [key: string]: string } = {};

  let lastX = 0;
  let lastKey: string | undefined;

  const parametricCalls: string[] = [];
  const offsets: Point[] = [];
  font.forEachGlyph(str + str[0], 0, 0, fontSize, {}, (glyph, x, y) => {
    if (lastKey) {
      widths[lastKey] = cleanCoord(x - lastX);
    }
    lastKey = undefined;
    lastX = x;

    const path = glyph.getPath(0, 0, fontSize, {
      // We want positive y going up
      // Unfortunately, yScale is not multiplied by the normal scale, so
      // we have to use some internals to get the scale
      yScale: (-1 / ((glyph.path as any).unitsPerEm || 1000)) * fontSize,
    });
    const key = getKey(glyph);
    if (parametricBodies[key] === undefined) {
      lastKey = key;
      // Performance could be improved by directly using path.commands
      // but it's easier to just use the existing path parser
      if (doPolygon) {
        const parametricBody = pathCommandsToList(path.commands);
        parametricBodies[key] = parametricBody;
      } else {
        const parametricBody = pathStringToParametric(path.toPathData(15));
        parametricBodies[key] = parametricBody;
      }
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
    latex: doPolygon
      ? `\\left[${parametricCalls.map(
          (key, i) =>
            `\\operatorname{polygon}\\left(P_{offsets}\\left[${
              i + 1
            }\\right] + L_{${key}}\\right)`
        )}\\right]`
      : `P_{offsets}+\\left[
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
    hidden: true,
  });
  for (const key in parametricBodies) {
    const body = parametricBodies[key]!;
    expressions.push({
      type: "expression",
      id: generateId(),
      folderId: parametricsFolderID,
      latex: doPolygon
        ? `L_{${key}} = ${body}`
        : `f_{${key}}\\left(t\\right) = ${body}`,
    });
    if (doWidths && widths[key]) {
      expressions.push({
        type: "expression",
        id: generateId(),
        folderId: parametricsFolderID,
        latex: `W_{${key}} = ${widths[key]}`,
      });
    }
  }
  return expressions;
}
