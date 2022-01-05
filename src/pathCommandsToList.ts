import { PathCommand } from "opentype.js";
import Point from "./point";

function getMinNTolerance(A: Point, tol: number) {
  /*
  Find the minimum integer `n` such that the curve r(t)=At^2+Bt+C, at all points,
  is within distance `tol` of the polyline approximation consisting of `n`
  segments from `n+1` evenly-spaced samples along the curve.

  Derivation:

  We care about the region of maximum curvature.
  The curvature is |r'(t)×r''(t)|/|r'(t)|^3.
  Numerator constant, so we want to minimize |r'(t)| where r(t)=2At+B,
  so |r'(t)|^2 = (2A.x*t+B.x)^2+(2A.y*t+B.y)^2
               = 4(A.x^2+A.y^2)t^2+4(A.xB.x+A.yB.y)t+(B.x^2+B.y^2)
  which is minimized when t=t0 with
    t0 = -(A.xB.x+A.yB.y)/(2(A.x^2+A.y^2))
  (remember to clamp t0 to between 0 and 1).

  So now we have that the curvature is maximized when t=t0. 
  In approximately the worst case, the maximum distance from the polyline to the curve
  is given by distance(r(t0), midpoint(r(t0-(1/(2n)),r(t0+(1/(2n))))
    in which t0 is halfway between the two closest samples
  Let h=1/(2n), so we have distance(r(t0), midpoint(r(t0-h), r(t0+h)))
  Conveniently, midpoint(r(t0-h), r(t0+h)) = r(t0)+Ah^2,
  so the distance is Ah^2.

  Now we want tol ≥ |Ah^2|, so
    h ≤ sqrt(tol / |A|)
    1/(2n) ≤ sqrt(tol / |A|)
    n ≥ (1/2) sqrt(|A| / tol)
  So our minimum n is ceil(sqrt(|A| / tol)/2)

  (So it turns out that t0 just cancels out lol)
  */
  return Math.ceil(Math.sqrt(A.mag() / tol) / 2);
}

function listPointQuadraticFormula(A: Point, B: Point, C: Point) {
  // samples At^2+Bt+C along [1...n]/n, assuming n >= 3
  /*
  = A/n^2*[1...n]^2+B/n*[1...n]+C
  = (1/n^2) * (A*[1...n]^2+B*n*[1...n]+C*n^2) ← currently outputting this
  = (1/n^2) * (A*[1...n]^2+[B*n+C*n^2,2*B*n+C*n^2...B*n^2+C*n^2])
  */
  let n = getMinNTolerance(A, 0.03);
  if (n < 1) {
    // n == 0, so A is (0,0), so this is a line segment
    // just push the last point
    n = 1;
  }
  if (n <= 3) {
    const outPoints = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      outPoints.push(
        A.mul(t * t)
          .add(B.mul(t))
          .add(C)
      );
    }
    return outPoints.map((p) => p.toLatex()).join(",");
  } else {
    return (
      `[1...${n}]^2${A.toLatex()}/${n * n}` +
      `+[1...${n}]${B.toLatex()}/${n}` +
      `+${C.toLatex()}`
    );
  }
}

export default function pathCommandsToList(commands: PathCommand[]) {
  let currentPoint = new Point(0, 0);
  let initialPoint = new Point(0, 0);
  const list = [];
  for (let cmd of commands) {
    let nextPoint = cmd.type === "Z" ? initialPoint : new Point(cmd.x, cmd.y);
    switch (cmd.type) {
      case "M":
        initialPoint = nextPoint;
        if (!nextPoint.eq(currentPoint)) list.push(nextPoint.toLatex());
        break;
      case "L":
      case "Z":
        if (!nextPoint.eq(currentPoint)) list.push(nextPoint.toLatex());
        if (cmd.type === "Z") {
          list.push("(0,[][1])");
        }
        break;
      case "Q":
        const controlPoint = new Point(cmd.x1, cmd.y1);
        list.push(
          listPointQuadraticFormula(
            currentPoint.sub(controlPoint.mul(2)).add(nextPoint),
            currentPoint.mul(-2).add(controlPoint.mul(2)),
            currentPoint
          )
        );
        break;
      case "C":
        throw new Error("Cubic beziers not yet handled");
    }
    currentPoint = nextPoint;
  }
  return `\\operatorname{join}(${list.join(",")})`;
}
