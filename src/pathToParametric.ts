import Point from "./point";
import { parsePath } from "./parsePath";
import commandsTable from "./commandsTable";

/*
Known to not be handled yet:
 - command A
 - implicit repetition of the command
*/

interface Part {
  startT: number;
  endT: number; // endT should = startT + 1
  value: string;
}

export interface State {
  parts: Part[];
  lastT: number; // endT for the last part, or 0
  currentPoint: Point;
  lastCubicControlPoint?: Point;
  lastQuadraticControlPoint?: Point;
  firstPoint?: Point;
}

function applyRelative(
  currentPoint: Point,
  command: string,
  args: number[],
  argsSpec: typeof commandsTable[string]["args"]
) {
  const isRelative = commandsTable[command] === undefined;
  if (isRelative) {
    for (let i = 0; i < argsSpec.length; i++) {
      if (argsSpec[i] === "X") {
        args[i] += currentPoint.x;
      } else if (argsSpec[i] === "Y") {
        args[i] += currentPoint.y;
      }
    }
  }
}

function mergeState(
  state: State,
  nextState: ReturnType<typeof commandsTable[string]["func"]>
) {
  state.parts = nextState.parts;
  const lastPart = nextState.parts[nextState.parts.length - 1];
  if (lastPart !== undefined) {
    state.lastT = lastPart.endT;
  }
  // current point gets redefined in each command
  state.currentPoint = nextState.currentPoint;
  // `last control points` get reset after each command
  state.lastCubicControlPoint = nextState?.lastCubicControlPoint;
  state.lastQuadraticControlPoint = nextState.lastQuadraticControlPoint;
  state.firstPoint = state.firstPoint ?? nextState.currentPoint;
}

function getParametricExpressions(state: State, normalize: boolean) {
  const numParts = state.parts.length;
  let latex = `\\left\\{${state.parts
    .map(
      (part, i) =>
        `${i < numParts - 1 ? `${part.startT}\\le T<${part.endT}:` : ""}${
          part.value
        }`
    )
    .join(",")}\\right\\}`;
  if (normalize) {
    latex = latex.replace(/T/g, `\\left(${numParts}t\\right)`);
    return [
      {
        type: "expression",
        latex: `p\\left(t\\right)=${latex}`,
      },
    ];
  } else {
    latex = latex.replace(/T/g, "u");
    return [
      {
        type: "expression",
        latex: `p_{0}\\left(u\\right)=${latex}`,
      },
      {
        type: "expression",
        latex: `p\\left(t\\right)=p_{0}\\left(${numParts}t\\right)`,
      },
    ];
  }
}

export function pathToParametric(path: string, normalize: boolean) {
  // path should be the contents of a `d=` attribute
  // see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  //
  // need to initialize currentPoint to (0,0) and others
  // need to handle lastT and firstPoint
  const commands = parsePath(path);
  const state: State = {
    parts: [],
    lastT: 0,
    currentPoint: new Point(0, 0),
  };
  for (const { command, args } of commands) {
    const entry = commandsTable[command.toUpperCase()];
    if (entry === undefined) return;
    const { args: argsSpec, func } = entry;
    if (args.length !== argsSpec.length) {
      throw new Error(
        `Incorrect number of args to command "${command}" in parsing of ${path}.` +
          `Expected ${argsSpec.length} but got ${args.length}.` +
          `Implicit repetition is not yet supported.`
      );
    }
    applyRelative(state.currentPoint, command, args, argsSpec);
    const nextState = func(state, args);
    mergeState(state, nextState);
  }
  return getParametricExpressions(state, normalize);
}
