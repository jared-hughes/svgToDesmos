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
  pathToDesmos(
    `M856 0q-71 6 -136 6h-404q-64 0 -135 -6v64q12 0 37.5 -1t38.5 -1q153 0 175 43q9 18 9 53v1087q-109 -54 -272 -54v64q250 0 379 133h10q29 0 35 -14q3 -6 3 -39v-1181q0 -33 8 -50q15 -33 117 -40q14 -1 135 0v-64z`
  ) + ";"
);
