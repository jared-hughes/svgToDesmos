import { pathCommandsToParametric } from "./pathToParametric";
import { Expression, generateId } from "./calcHelpers";
import Canvg, { RenderingContext2D } from "canvg";
import RenderingContext from "./RenderingContext";

function getData(svg: string, filename?: string) {
  const ctx = new RenderingContext();
  const v = Canvg.fromString(ctx as RenderingContext2D, svg);
  v.start();
  return {
    paths: ctx.paths,
    titleInfo:
      (filename ?? "") +
      "\n\nConverted to Desmos using https://github.com/jared-hughes/svgToDesmos.",
  };
}

export default function svgToExpressions(svg: string, filename?: string) {
  const { paths, titleInfo } = getData(svg, filename);
  const expressions: Expression[] = [
    {
      type: "text",
      id: generateId(),
      text: titleInfo,
    },
  ];
  for (const path of paths) {
    const parametricLatex = pathCommandsToParametric(path.path);
    const folderId = generateId();
    expressions.push({
      type: "folder",
      id: folderId,
      title: "",
      hidden: false,
      collapsed: true,
    });
    expressions.push({
      type: "expression",
      id: generateId(),
      folderId: folderId,
      latex: parametricLatex,
      fill: true,
    });
  }
  return expressions;
}
