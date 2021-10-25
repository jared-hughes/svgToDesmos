import { CommandWithArgs } from "./parsePath";
import { pathCommandsToParametric } from "./pathToParametric";
import { Expression, generateId } from "./calcHelpers";

type Path = CommandWithArgs[];

export default class RenderingContext implements CanvasRenderingContext2D {
  /* Implementation-specific properties */
  // Use a real canvas and context to handle transform internals and placate references to ctx.canvas
  canvas: HTMLCanvasElement;
  realCtx: CanvasRenderingContext2D;

  /* Interface-required properties */
  globalAlpha: number = 1;
  fillStyle: string | CanvasGradient | CanvasPattern = "#000";
  strokeStyle: string | CanvasGradient | CanvasPattern = "#000";
  lineWidth: number = 1;

  // For now, simply store a list of commands, and use the old rendering from a list of commands
  exprs: Expression[] = [];
  currentPath: Path;

  /* Implementation-specific methods */

  constructor() {
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d");
    if (ctx === null) throw new Error("Context is unexpectedly null");
    this.realCtx = ctx;
    this.currentPath = this.getDefaultPath();
  }

  transformPoint(x: number, y: number) {
    const p = new DOMPoint(x, y).matrixTransform(this.getTransform());
    return [p.x, p.y];
  }

  getDefaultPath() {
    // Will be mutated, so must return a fresh object
    return [
      {
        command: "M",
        args: this.transformPoint(0, 0),
      },
    ];
  }

  /* Interface-required methods */
  beginPath() {
    this.currentPath = this.getDefaultPath();
  }
  fill(fillRule?: CanvasFillRule | undefined): void;
  fill(path: Path2D, fillRule?: CanvasFillRule | undefined): void;
  fill(
    fillRuleOrPath?: CanvasFillRule | Path2D | undefined,
    fillRuleMaybe?: CanvasFillRule | undefined
  ) {
    if (fillRuleOrPath !== "nonzero") {
      // console.warn("Desmos uses nonzero fill rule. Appearance may differ.");
    }
    if (typeof this.fillStyle !== "string") {
      throw new Error("Only string stroke styles are handled");
    }
    this.exprs.push({
      type: "expression",
      id: generateId(),
      latex: pathCommandsToParametric(this.currentPath),
      fill: true,
      lines: false,
      color: this.fillStyle,
      fillOpacity: this.globalAlpha.toString(),
    });
  }
  stroke(path?: Path2D) {
    if (path !== undefined) {
      throw new Error("A path was passed to stroke. Not handled");
    }
    if (typeof this.strokeStyle !== "string") {
      throw new Error("Only string stroke styles are handled");
    }
    this.exprs.push({
      type: "expression",
      id: generateId(),
      latex: pathCommandsToParametric(this.currentPath),
      fill: false,
      lines: true,
      color: this.strokeStyle,
      lineOpacity: this.globalAlpha.toString(),
    });
  }
  moveTo(x: number, y: number) {
    this.currentPath.push({
      command: "M",
      args: this.transformPoint(x, y),
    });
  }
  lineTo(x: number, y: number) {
    this.currentPath.push({
      command: "L",
      args: this.transformPoint(x, y),
    });
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    this.currentPath.push({
      command: "Q",
      args: [...this.transformPoint(cpx, cpy), ...this.transformPoint(x, y)],
    });
  }
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) {
    this.currentPath.push({
      command: "C",
      args: [
        ...this.transformPoint(cp1x, cp1y),
        ...this.transformPoint(cp2x, cp2y),
        ...this.transformPoint(x, y),
      ],
    });
  }
  closePath() {
    this.currentPath.push({
      command: "Z",
      args: [],
    });
  }
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean | undefined
  ) {
    console.log("arc", x, y, radius, startAngle, endAngle, counterclockwise);
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    console.log("arcTo", x1, y1, x2, y2, r);
  }
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean | undefined
  ) {
    console.log(
      "ellipse",
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      counterclockwise
    );
  }
  rect(x: number, y: number, w: number, h: number) {
    console.log("rect", x, y, w, h);
  }
  clearRect(x: number, y: number, w: number, h: number) {
    console.log("clearRect", x, y, w, h);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    console.log("fillRect", x, y, w, h);
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    console.log("strokeRect", x, y, w, h);
  }

  /* Interface-required methods that just pass through to realCtx */
  save() {
    this.realCtx.save();
  }
  restore() {
    this.realCtx.restore();
  }
  getTransform() {
    return this.realCtx.getTransform();
  }
  resetTransform() {
    this.realCtx.resetTransform();
  }
  rotate(angle: number) {
    this.realCtx.rotate(angle);
  }
  scale(x: number, y: number) {
    this.realCtx.scale(x, y);
  }
  setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): void;
  setTransform(transform?: DOMMatrix2DInit | undefined): void;
  setTransform(
    aOrTransform?: number | DOMMatrix2DInit | undefined,
    b?: number,
    c?: number,
    d?: number,
    e?: number,
    f?: number
  ) {
    if (typeof aOrTransform === "number") {
      if (
        b !== undefined &&
        c !== undefined &&
        d !== undefined &&
        e !== undefined &&
        f !== undefined
      ) {
        this.realCtx.setTransform(aOrTransform, b, c, d, e, f);
      }
    } else {
      this.realCtx.setTransform(aOrTransform);
    }
  }
  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    this.realCtx.transform(a, b, c, d, e, f);
  }
  translate(x: number, y: number) {
    this.realCtx.translate(x, y);
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return this.realCtx.createLinearGradient(x0, y0, x1, y1);
  }
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ) {
    return this.realCtx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  /* These methods work just enough to avoid crashing on some SVGs */
  fillText() {}
  strokeText() {}

  /* Ignore these, at least for now */
  getContextAttributes!: () => CanvasRenderingContext2DSettings;
  globalCompositeOperation!: string;
  commit!: string;
  drawImage!: any;
  clip!: () => void;
  isPointInPath!: any;
  isPointInStroke!: any;
  createPattern!: any;
  filter!: any;
  createImageData!: any;
  getImageData!: any;
  putImageData!: any;
  imageSmoothingEnabled!: any;
  imageSmoothingQuality!: any;
  lineCap!: any;
  lineDashOffset!: any;
  lineJoin!: any;
  miterLimit!: any;
  getLineDash!: any;
  setLineDash!: any;
  shadowBlur!: any;
  shadowColor!: any;
  shadowOffsetX!: any;
  shadowOffsetY!: any;
  measureText!: any;
  direction!: any;
  font!: any;
  textAlign!: any;
  textBaseline!: any;
  drawFocusIfNeeded!: any;
  scrollPathIntoView!: any;
}
