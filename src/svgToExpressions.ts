import { pathToParametric } from "./pathToParametric";

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

function getPaths(svg: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const paths: {
    path: string;
    label: string;
  }[] = [];
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
    // nodes always have a children property,
    // so (for leaves) it is an empty HTMLCollection
    nodeStack.push(...currentNode.children);
  }
  return paths;
}

function generateId() {
  return (window as any).Calc.controller.generateId() as string;
}

interface Expression {
  // super loose since this is a small project
  type: string;
  id: string;
  [key: string]: any;
}

export function svgToExpressions(svg: string) {
  const paths = getPaths(svg);
  const expressions: Expression[] = [];
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
    });
  }
  return expressions;
}
