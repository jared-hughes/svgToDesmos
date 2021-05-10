import type { State } from "./pathToParametric";
import Point from "./point";
import { Polynomial } from "./Polynomial";

function moveTo({ parts }: State, p: Point) {
  return {
    parts,
    currentPoint: p,
    initialPoint: p,
  };
}

const bernstein01 = new Polynomial([1, -1]);
const bernstein11 = new Polynomial([0, 1]);
function lineTo({ parts, lastT, currentPoint }: State, p: Point) {
  if (p.eq(currentPoint)) {
    return {
      parts,
      currentPoint,
    };
  }
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        value: bernstein01.mulPoint(currentPoint).add(bernstein11.mulPoint(p)),
      },
    ],
    currentPoint: p,
  };
}

const bernstein03 = new Polynomial([1, -3, 3, -1]);
const bernstein13 = new Polynomial([0, 3, -6, 3]);
const bernstein23 = new Polynomial([0, 0, 3, -3]);
const bernstein33 = new Polynomial([0, 0, 0, 1]);
function cubicBezierTo(
  { parts, lastT, currentPoint }: State,
  p1: Point,
  p2: Point,
  p: Point
) {
  if (p1.eq(currentPoint) && p2.eq(currentPoint) && p.eq(currentPoint)) {
    return {
      parts,
      // still updates according to the SVG spec
      lastCubicControlPoint: p2,
      currentPoint,
    };
  }
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        value: bernstein03
          .mulPoint(p1)
          .add(bernstein13.mulPoint(p1))
          .add(bernstein23.mulPoint(p2))
          .add(bernstein33.mulPoint(currentPoint)),
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

const bernstein02 = new Polynomial([1, -2, 1]);
const bernstein12 = new Polynomial([0, 2, -2]);
const bernstein22 = new Polynomial([0, 0, 1]);
function quadraticBezierTo(
  { parts, lastT, currentPoint }: State,
  p1: Point,
  p: Point
) {
  if (p1.eq(currentPoint) && p.eq(currentPoint)) {
    return {
      parts,
      // still updates according to the SVG spec
      lastQuadraticControlPoint: p1,
      currentPoint,
    };
  }
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        value: bernstein02
          .mulPoint(currentPoint)
          .add(bernstein12.mulPoint(p1))
          .add(bernstein22.mulPoint(p)),
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
  initialPoint?: Point;
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
    func: (state) => lineTo(state, state.initialPoint ?? new Point(0, 0)),
  },
};

export default commandsTable;
