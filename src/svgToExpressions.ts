import { pathToParametric } from "./pathToParametric";
import { Expression, generateId } from "./calcHelpers";

function getLabel(node: Element) {
  const lines = [`<${node.localName}>`];
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    if (attr !== undefined && attr.name !== "d") {
      lines.push(`${attr.name}: ${attr.value}`);
    }
  }
  return lines.join("\n");
}

function getData(svg: string, filename?: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const paths: {
    path: string;
    label: string;
  }[] = [];
  let titleInfo = filename ?? "";
  titleInfo +=
    "\n\nConverted to Desmos using https://github.com/jared-hughes/svgToDesmos.";
  const nodeStack = [...doc.children];
  while (nodeStack.length > 0) {
    const currentNode = nodeStack.pop();
    if (currentNode === undefined) break;
    // insert a path for all nodes with a `d` attribute
    const pathAttribute = currentNode.attributes.getNamedItem("d");
    if (pathAttribute !== null) {
      paths.push({
        path: pathAttribute.value,
        label: getLabel(currentNode),
      });
    }
    // add identifying information to the title
    if (["font", "font-face"].includes(currentNode.localName)) {
      if (titleInfo !== "") titleInfo += "\n\n";
      titleInfo += getLabel(currentNode);
    }
    // nodes always have a children property,
    // so (for leaves) it is an empty HTMLCollection
    nodeStack.unshift(...[...currentNode.children].reverse());
  }
  return {
    paths,
    titleInfo,
  };
}

const groupSize = 5;
export function svgToExpressions(svg: string, filename?: string) {
  const { paths, titleInfo } = getData(svg, filename);
  const expressions: Expression[] = [
    {
      type: "text",
      id: generateId(),
      text: titleInfo,
    },
  ];
  let folderId = "";
  let i = 0;
  for (const path of paths) {
    if (i % groupSize === 0) {
      folderId = generateId();
      expressions.push({
        type: "folder",
        id: folderId,
        title: `Group ${(i / groupSize).toFixed(0)}`,
        hidden: true,
        collapsed: true,
      });
    }
    const parametricLatex = pathToParametric(path.path);
    expressions.push({
      type: "expression",
      id: generateId(),
      folderId: folderId,
      latex: `f_{${i}}(t)=${parametricLatex}`,
    });
    i += 1;
  }
  return expressions;
}
