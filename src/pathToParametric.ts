import Point from "./point";
import { CommandWithArgs, parsePath } from "./parsePath";
import commandsTable from "./commandsTable";
import { Polynomial, PointPolynomial, UndefinedPoint } from "./Polynomial";
import { PointLatexExpr } from "./LatexExpr";

interface Part {
  startT: number;
  value: PointPolynomial | PointLatexExpr | UndefinedPoint; // map from [0,1) to curve
}

export interface State {
  parts: Part[];
  lastT: number;
  currentPoint: Point;
  lastCubicControlPoint?: Point;
  lastQuadraticControlPoint?: Point;
  initialPoint?: Point;
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
  state.initialPoint = nextState.initialPoint ?? state.initialPoint;
}

function getParametricLatex(state: State) {
  const numParts = state.parts.length;
  const tScale = numParts;
  const mainParametric = `${state.parts
    .map(
      (part) =>
        `t \\leq${part.startT + 1}/${tScale}:${part.value
          .applyTo(new Polynomial([-part.startT, tScale]))
          .toLatex("t")}`
    )
    .join(",")}`;
  const smallCase = `t<0:${state.initialPoint?.toLatex()}`;
  // this is the default condition, so no explicit condition needed
  const largeCase = `${state.currentPoint?.toLatex()}`;
  return `\\left\\{${smallCase},${mainParametric},${largeCase}\\right\\}`;
}

export function pathStringToParametric(path: string) {
  // path should be the contents of a `d=` attribute
  // see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  const commands = parsePath(path);
  return pathCommandsToParametric(commands);
}

export function pathCommandsToParametric(commands: CommandWithArgs[]) {
  if (commands.length === 0) {
    // undefined point
    return "([][1],0)";
  }
  // need to initialize currentPoint to (0,0) and others
  // need to handle lastT and initialPoint
  const state: State = {
    parts: [],
    lastT: 0,
    currentPoint: new Point(0, 0),
  };
  for (const { command, args } of commands) {
    const entry = commandsTable[command.toUpperCase()];
    if (entry === undefined) {
      throw new Error(`Command ${command} unknown.`);
    }
    const { args: argsSpec, func } = entry;
    if (args.length !== argsSpec.length) {
      throw new Error(
        `Incorrect number of args to command "${command}".\n` +
          `Expected ${argsSpec.length} but got ${args.length}.\n` +
          `Looks like ${command} ${args.join(" ")}`
      );
    }
    applyRelative(state.currentPoint, command, args, argsSpec);
    const nextState = func(state, args);
    mergeState(state, nextState);
  }
  return getParametricLatex(state);
}
