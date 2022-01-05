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
  const list = state.expressions.list as Expression[];
  for (let expr of exprs) {
    const index = list.findIndex((e) => e.id === expr.id);
    const match = list[index];
    if (match !== undefined) {
      list[index] = {
        ...expr,
        folderId: match.folderId,
      };
    } else {
      list.push(expr);
    }
  }
  Calc.setState(state, { allowUndo: true });
}
