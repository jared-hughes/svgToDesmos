import { pathToExpressions } from "./pathToParametric";

function getPaths(svg: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const paths: string[] = [];
  const nodeStack = [...doc.children];
  while (nodeStack.length > 0) {
    const currentNode = nodeStack.pop();
    if (currentNode === undefined) break;
    // insert a path for all nodes with a `d` attribute
    const pathAttribute = currentNode.attributes.getNamedItem("d");
    if (pathAttribute !== null) {
      paths.push(pathAttribute.value);
    }
    // nodes always have a children property,
    // so (for leaves) it is an empty HTMLCollection
    nodeStack.push(...currentNode.children);
  }
  return paths;
}

export function svgToExpressions(svg: string, normalize: boolean) {
  const paths = getPaths(svg);
  const expressions = [];
  for (const path of paths) {
    expressions.push(...pathToExpressions(path, normalize));
  }
  return expressions;
}
