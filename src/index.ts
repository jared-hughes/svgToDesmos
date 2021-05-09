import { pathToParametric } from "./pathToParametric";

function insertPathAsParametrics(path: string, normalize: boolean) {
  const exprs = pathToParametric(path, normalize);
  (window as any).Calc.setExpressions(exprs);
}

(window as any).insertPathAsParametrics = insertPathAsParametrics;
