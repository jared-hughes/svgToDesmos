interface Expression {
  type: string;
  id: string;
  folderId?: string;
}

interface TextExpr extends Expression {
  type: "text";
  text: string;
}

interface FolderExpr extends Expression {
  type: "folder";
  title: string;
  id: string;
  collapsed?: boolean;
}

interface ExpressionExpr extends Expression {
  type: "expression";
  folderId?: string;
  latex: string;
  fill?: boolean;
  fillOpacity?: string;
  lines?: boolean;
  parametricDomain?: { min: string; max: string };
}

type AnyExpr = TextExpr | FolderExpr | ExpressionExpr;

interface State {
  expressions: {
    list: AnyExpr[];
  };
  graph: {
    viewport: {
      xmin: number;
      xmax: number;
      ymin: number;
      ymax: number;
    };
  };
}

interface Calc {
  controller: {
    generateId(): string;
  };
  getState(): State;
  setState(state: State, opts: { allowUndo: boolean }): void;
}

function getProp(text: string, prop: string) {
  return text
    .split("\n")
    .find((line) => line.startsWith(prop))
    ?.slice(prop.length + 2);
}

interface StringString {
  [key: string]: string;
}

function getTokens(str: string, unicodesDefined: string[]) {
  // tokenize
  const tokens: string[] = [];
  let i = 0;
  while (i < str.length) {
    // attempt trigraphs, then digraphs, then mono-graphs
    for (let di = 3; di >= 0; di--) {
      if (di === 0) {
        tokens.push(".notdef");
        i += 1;
        break;
      }
      const substr = str.substring(i, i + di);
      if (i + di <= str.length && unicodesDefined.includes(substr)) {
        tokens.push(substr);
        i += di;
        break;
      }
    }
  }
  return tokens;
}

export default function extractText(str: string) {
  /* This is kinda spaghetti (used to be pasted into console) but it works for now */
  const Calc = (window as any).Calc as Calc;
  const state = Calc.getState();
  const generateId = () => Calc.controller.generateId();
  const folderIdToUnicode: StringString = {};
  const unicodesDefined: string[] = [];
  const unicodeToHorizAdvX: { [key: string]: number } = {};
  const unicodeToParametricLatex: StringString = {};
  const unicodeToFunctionCall: StringString = {};
  let globalHorizAdvX = 1024;
  let globalUnitsPerEm = 2048;
  for (const expr of state.expressions.list) {
    if (expr.type === "text") {
      globalHorizAdvX = parseFloat(
        getProp(expr.text, "horiz-adv-x") ?? "" + globalHorizAdvX
      );
      globalUnitsPerEm = parseFloat(
        getProp(expr.text, "units-per-em") ?? "" + globalUnitsPerEm
      );
    } else if (expr.type === "folder") {
      let unicode = getProp(expr.title, "unicode");
      const glyphName = getProp(expr.title, "glyph-name");
      if (glyphName === ".notdef") unicode = glyphName;
      if (unicode && (str.includes(unicode) || unicode === ".notdef")) {
        unicodesDefined.push(unicode);
        folderIdToUnicode[expr.id] = unicode;
        unicodeToHorizAdvX[unicode] = parseFloat(
          getProp(expr.title, "horiz-adv-x") ?? "1000"
        );
        if (glyphName) {
          unicodeToFunctionCall[unicode] = `p_{${glyphName.replace(
            /[^A-Za-z0-9]/g,
            ""
          )}}\\left(t\\right)`;
        }
      }
    } else if (expr.type === "expression" && expr.folderId !== undefined) {
      const unicode = folderIdToUnicode[expr.folderId];
      if (unicode !== undefined) {
        unicodeToParametricLatex[unicode] = expr.latex;
      }
    }
  }
  if (Object.keys(unicodeToParametricLatex).length === 0) {
    console.warn("No glyphs defined. Are you sure a font is loaded?");
  }
  // special case for the space character (and default for .notdef
  // not sure how the space width is defined typically
  for (const character of [" ", ".notdef"]) {
    unicodesDefined.push(character);
    unicodeToHorizAdvX[character] = 0.3 * globalUnitsPerEm;
    unicodeToFunctionCall[character] = "(0, 0/0)";
  }
  const tokens = getTokens(str, unicodesDefined);
  const folderId = generateId();
  state.expressions.list = [
    ...state.expressions.list.filter((e) => e.type === "text"),
    {
      type: "expression",
      id: generateId(),
      latex: `\\left(x_{offsets},0\\right)+\\left[${tokens
        .map((c) => `${unicodeToFunctionCall[c]}`)
        .join(",")}\\right]`,
      fill: true,
      fillOpacity: "1",
      lines: false,
      parametricDomain: { min: "", max: "0.99999" },
    },
    {
      type: "expression",
      id: generateId(),
      latex: `x_{offsets}=\\sum_{i=1}^{\\left[0...${
        tokens.length - 1
      }\\right]}\\left[${tokens.map(
        (c) => unicodeToHorizAdvX[c] ?? globalHorizAdvX
      )}\\right]\\left[i\\right]`,
    },
    {
      type: "folder",
      id: folderId,
      title: "Font Parametric Definitions",
      collapsed: true,
    },
    ...unicodesDefined
      .filter(
        (unicode) =>
          tokens.includes(unicode) &&
          unicodeToFunctionCall[unicode] &&
          unicodeToParametricLatex[unicode]
      )
      .map(
        (unicode) =>
          ({
            type: "expression",
            id: generateId(),
            folderId: folderId,
            latex: `${unicodeToFunctionCall[unicode]}=${unicodeToParametricLatex[unicode]}`,
          } as const)
      ),
  ];
  state.graph.viewport.xmin = -0.2 * globalUnitsPerEm;
  state.graph.viewport.xmax =
    Math.min(tokens.length + 0.2, 5.5) * globalUnitsPerEm;
  Calc.setState(state, { allowUndo: true });
}
