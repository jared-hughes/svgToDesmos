import { serializeFloat } from "./float";
import LatexExpr from "./LatexExpr";
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
          .mulPoint(currentPoint)
          .add(bernstein13.mulPoint(p1))
          .add(bernstein23.mulPoint(p2))
          .add(bernstein33.mulPoint(p)),
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

function arcCanvas(
  { parts, lastT, currentPoint }: State,
  p: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  counterclockwise: boolean,
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
) {
  const TAU = 2 * Math.PI;
  console.log("se", startAngle, endAngle);
  startAngle = ((startAngle % TAU) + TAU) % TAU;
  endAngle = ((endAngle % TAU) + TAU) % TAU;
  console.log("se1", startAngle, endAngle);
  if (counterclockwise) {
    // counterclockwise: decreasing angle
    if (endAngle > startAngle) {
      endAngle -= TAU;
    }
  } else {
    // clockwise: increasing angle
    if (endAngle < startAngle) {
      endAngle += TAU;
    }
  }
  console.log("se2", startAngle, endAngle);
  const angle = new Polynomial([startAngle, endAngle - startAngle]);
  const r = serializeFloat(radius);
  return {
    parts: [
      ...parts,
      {
        startT: lastT,
        value: new LatexExpr(
          `(${e},${f})+(${a}(${p.x}+${r}\\cos(%%t%%))+${b}(${p.y}+${r}\\sin(%%t%%)),${c}(${p.x}+${r}\\cos(%%t%%))+${d}(${p.y}+${r}\\sin(%%t%%)))`
        ).applyTo(angle),
      },
    ],
    currentPoint: p.add(
      new Point(Math.cos(startAngle), Math.cos(endAngle)).mul(radius)
    ),
  };
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
  ARCCANVAS: {
    /* This is not the SVG A command. Kinda hacky grouping it with commands
    (radius etc are not positions, counterclockwise is not number, etc), but this should be fine.
    
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      counterclockwise?: boolean | undefined
    )*/
    args: [X, Y, X, Y, X, Y, X, Y, X, Y, X, Y],
    func: (
      state,
      [x, y, radius, startAngle, endAngle, counterclockwise, a, b, c, d, e, f]
    ) =>
      arcCanvas(
        state,
        new Point(x, y),
        radius ?? 0,
        startAngle ?? 0,
        endAngle ?? 0,
        (counterclockwise ?? false) as any as boolean,
        a ?? 0,
        b ?? 0,
        c ?? 0,
        d ?? 0,
        e ?? 0,
        f ?? 0
      ),
  },
  Z: {
    args: [],
    // assumes firstPoint is defined (who would start a path with Z?)
    func: (state) => lineTo(state, state.initialPoint ?? new Point(0, 0)),
  },
};

export default commandsTable;
