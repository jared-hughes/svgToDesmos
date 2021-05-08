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
  state.firstPoint = nextState.firstPoint ?? state.firstPoint;
}

function getParametricLatex(state: State) {
  const numParts = state.parts.length;
  return `\\left\\{${state.parts
    .map(
      (part, i) =>
        `${
          i < numParts - 1
            ? `${part.startT}\\le ${numParts}t<${part.endT}:`
            : ""
        }${part.value.replace(/T/g, `\\left(${numParts}t\\right)`)}`
    )
    .join(",")}\\right\\}`;
}

function pathToDesmos(path: string) {
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
  return getParametricLatex(state);
}

console.log(
  pathToDesmos(`M 110,90
           c 20,0 15,-80 40,-80
           s 20,80 40,80`) + ";"
);
