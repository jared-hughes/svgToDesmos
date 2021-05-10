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

export function svgToExpressions(svg: string, filename?: string) {
  const { paths, titleInfo } = getData(svg, filename);
  const expressions: Expression[] = [
    {
      type: "text",
      id: generateId(),
      text: titleInfo,
    },
  ];
  for (const path of paths) {
    const parametricLatex = pathToParametric(path.path);
    const folderId = generateId();
    expressions.push({
      type: "folder",
      id: folderId,
      title: path.label,
      hidden: true,
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
