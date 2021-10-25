import Canvg, { RenderingContext2D } from "canvg";
import RenderingContext from "./RenderingContext";
import { Expression, generateId } from "./calcHelpers";

function getData(svg: string, filename?: string) {
  const ctx = new RenderingContext();
  const v = Canvg.fromString(ctx as RenderingContext2D, svg);
  v.start();
  return {
    exprs: ctx.exprs,
    titleInfo:
      (filename ?? "") +
      "\n\nConverted to Desmos using https://github.com/jared-hughes/svgToDesmos.",
  };
}

export default function svgToExpressions(svg: string, filename?: string) {
  const { exprs, titleInfo } = getData(svg, filename);
  const expressions: Expression[] = [
    {
      type: "text",
      id: generateId(),
      text: titleInfo,
    },
  ];
  for (const expr of exprs) {
    const folderId = generateId();
    expressions.push({
      type: "folder",
      id: folderId,
      title: "",
      hidden: false,
      collapsed: true,
    });
    expr.folderId = folderId;
    expressions.push(expr);
  }
  return expressions;
}
