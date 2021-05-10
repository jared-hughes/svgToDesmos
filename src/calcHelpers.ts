export function generateId() {
  return (window as any).Calc.controller.generateId() as string;
}

export interface Expression {
  // super loose since this is a small project
  type: string;
  id: string;
  [key: string]: any;
}

export function insertExpressions(exprs: Expression[]) {
  // use Calc.setExpressions() for the officially-supported (limited) API
  const Calc = (window as any).Calc;
  const state = Calc.getState();
  state.expressions.list.push(...exprs);
  Calc.setState(state, { allowUndo: true });
}
