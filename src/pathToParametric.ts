import Point from "./point";
import { parsePath } from "./parsePath";
import commandsTable from "./commandsTable";
import { Polynomial, PointPolynomial } from "./Polynomial";

/*
Known to not be handled yet:
 - command A
 - implicit repetition of the command
*/

interface Part {
  startT: number;
  value: PointPolynomial; // map from [0,1) to curve
}

export interface State {
  parts: Part[];
  lastT: number;
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
    state.lastT = lastPart.startT + 1;
  }
  // current point gets redefined in each command
  state.currentPoint = nextState.currentPoint;
  // `last control points` get reset after each command
  state.lastCubicControlPoint = nextState?.lastCubicControlPoint;
  state.lastQuadraticControlPoint = nextState.lastQuadraticControlPoint;
  state.firstPoint = state.firstPoint ?? nextState.currentPoint;
}

function getParametric(state: State) {
  const numParts = state.parts.length;
  const tScale = numParts;
  const mainParametric = `${state.parts
    .map(
      (part) =>
        `${tScale}t \\leq${part.startT + 1}:${part.value
          .applyTo(new Polynomial([-part.startT, tScale]))
          .toHornerLatex("t")}`
    )
    .join(",")}`;
  const smallCase = `t<0:${state.firstPoint?.toLatex()}`;
  // this is the default condition, so no explicit condition needed
  const largeCase = `${state.currentPoint?.toLatex()}`;
  return [
    {
      type: "expression",
      latex: `\\left\\{${smallCase},${mainParametric},${largeCase}\\right\\}`,
    },
  ];
}

export function pathToExpressions(path: string) {
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
    if (entry === undefined) {
      throw new Error(`Command ${command} unknown in parsing of ${path}.`);
    }
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
  return getParametric(state);
}
