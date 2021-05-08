import type { State } from "./path2desmos";
import Point from "./point";

function t(lastT: number) {
  if (lastT === 0) {
    return `T`;
  } else {
    return `\\left(T-${lastT}\\right)`;
  }
}

function moveTo({ parts }: State, p: Point) {
  return {
    parts,
    currentPoint: p,
  };
}

function lineTo({ parts, lastT, currentPoint }: State, p: Point) {
  const T = t(lastT);
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        endT: lastT + 1,
        value: `${currentPoint.toLatex()}+${p.sub(currentPoint).toLatex()}${T}`,
      },
    ],
    currentPoint: p,
  };
}

function cubicBezierTo(
  { parts, lastT, currentPoint }: State,
  p1: Point,
  p2: Point,
  p: Point
) {
  const T = t(lastT);
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        endT: lastT + 1,
        value: `${currentPoint.toLatex()}+${p1
          .sub(currentPoint)
          .mul(3)
          .toLatex()}\\left(1-${T}\\right)^{2}${T}+${p2
          .sub(currentPoint)
          .mul(3)
          .toLatex()}\\left(1-${T}\\right)${T}^{2}+${p
          .sub(currentPoint)
          .toLatex()}${T}^{3}`,
      },
    ],
    lastCubicControlPoint: p2,
    currentPoint: p,
  };
}

function smoothCubicBezierTo(state: State, p2: Point, p: Point) {
  return cubicBezierTo(
    state,
    state.lastCubicControlPoint !== undefined
      ? state.currentPoint.mul(2).sub(state.lastCubicControlPoint) // 2x-y = x-(y-x)
      : state.currentPoint,
    p2,
    p
  );
}

function quadraticBezierTo(
  { parts, lastT, currentPoint }: State,
  p1: Point,
  p: Point
) {
  const T = t(lastT);
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        endT: lastT + 1,
        value: `${currentPoint.toLatex()}+${p1
          .sub(currentPoint)
          .mul(2)
          .toLatex()}\\left(${T}-${T}^2\\right)+${p
          .sub(currentPoint)
          .toLatex()}${T}^{2}`,
      },
    ],
    lastQuadraticControlPoint: p1,
    currentPoint: p,
  };
}

function smoothQuadraticBezierTo(state: State, p: Point) {
  return quadraticBezierTo(
    state,
    state.lastQuadraticControlPoint !== undefined
      ? state.currentPoint.mul(2).sub(state.lastQuadraticControlPoint) // 2x-y = x-(y-x)
      : state.currentPoint,
    p
  );
}

type StateOptional = {
  parts: State["parts"];
  currentPoint: Point;
  lastCubicControlPoint?: Point;
  lastQuadraticControlPoint?: Point;
};

interface CommandsTableEntry {
  args: ("X" | "Y")[];
  func: (state: State, args: number[]) => StateOptional;
}

const X = "X";
const Y = "Y";

const commandsTable: { [key: string]: CommandsTableEntry } = {
  M: {
    args: [X, Y],
    func: (state, [x, y]) => moveTo(state, new Point(x, y)),
  },
  L: {
    args: [X, Y],
    func: (state, [x, y]) => lineTo(state, new Point(x, y)),
  },
  H: {
    args: [X],
    func: (state, [x]) => lineTo(state, new Point(x, state.currentPoint.y)),
  },
  V: {
    args: [Y],
    func: (state, [y]) => lineTo(state, new Point(state.currentPoint.x, y)),
  },
  C: {
    args: [X, Y, X, Y, X, Y],
    func: (state, [x1, y1, x2, y2, x, y]) =>
      cubicBezierTo(
        state,
        new Point(x1, y1),
        new Point(x2, y2),
        new Point(x, y)
      ),
  },
  S: {
    args: [X, Y, X, Y],
    func: (state, [x2, y2, x, y]) =>
      smoothCubicBezierTo(state, new Point(x2, y2), new Point(x, y)),
  },
  Q: {
    args: [X, Y, X, Y],
    func: (state, [x1, y1, x, y]) =>
      quadraticBezierTo(state, new Point(x1, y1), new Point(x, y)),
  },
  T: {
    args: [X, Y],
    func: (state, [x, y]) => smoothQuadraticBezierTo(state, new Point(x, y)),
  },
  // A: Not Implemented,
  Z: {
    args: [],
    // assumes firstPoint is defined (who would start a path with Z?)
    func: (state) => lineTo(state, state.firstPoint ?? new Point(0, 0)),
  },
};

export default commandsTable;
