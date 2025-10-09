# SVG To Desmos

Yes, other SVG to Desmos scripts exist, but this one is special because it:

- operates directly in the browser
- is optimized to create **short, fast** parametrics using polynomial arithmetic and Horner's method
- handles SVG transforms and more (see the Limitations section below)
- handles font files (TTF, etc.)

## A few example graphs

- [Circles Single](https://www.desmos.com/calculator/a889yoavht)
- [Dancing Script](https://www.desmos.com/calculator/rtpmycwixz)
- [Lobster Regular](https://www.desmos.com/calculator/29ozjnu3aw)

## Why not use Desmos labels for fonts?

Labels cannot be skewed, so placing them in 3D does not work. Parametrics fix this by letting you use a projection function on their coordinates. See this [3D projection graph](https://www.reddit.com/r/desmos/comments/n80zjj/desmos_not_manim_quantum_mechanical_spin/) as an example.

Also, labels' size are relative to the graph viewport size in pixels, not math size, so zooming changes their size relative to other distances. Parametrics use math units to fix this problem.

## Installation

After installing the TamperMonkey browser extension, install this userscript by opening [the latest release](https://github.com/jared-hughes/svgToDesmos/releases/latest/download/svgToDesmos.user.js) then clicking <kbd>Install</kbd>.

- after reloading Desmos, the buttons should appear at the top

- You probably want to disable the userscript when you don't need it :)

## Usage for general SVGs

It's not the default, check the "Font/SVG" toggle first in order to work with an SVG rather than the default of a font.

1. Start from a blank graph to avoid messing up a graph with a ton of a parametrics
2. Use the <kbd>Choose File</kbd> button labelled with "SVG," and select your SVG file, then click "insert SVG"
3. The parametrics should now be inserted, each one to its own folder and hidden by default. You probably want to look through and un-hide many. (tip: zoom out).

## Usage for font files

1. Obtain a font file, such as [Google fonts](https://fonts.google.com)
   - I've tested with TTF files, and Opentype (the font library that svgToDesmos uses) should support TTF, WOFF, and OTF files.
2. Load a font through the <kbd>Choose File</kbd> button labelled "Font."
3. Put text in the input box below the button, then click "Extract text."
4. The text should be inserted. Each individual glyph is its own function in the "Parametric glyph definitions" folder, and these are displayed in the "Render string" folder

## Polygon option

The "polygon" option outputs polygons instead of parametric curves. Polygons are typically faster than parametrics
because Desmos always samples parametrics to get at least 1000 points, even along straight lines. Using a polygon
allows more careful control, so it can calculate with fewer total points.

In "polygon" mode, the tolerance value affects how many points are created. It roughly gives an upper bound on the
distance between a sample point and the "true" curve. The default tolerance of 0.03 means that no sample point will
be more than 0.03pt from the true curve, if you consider the font size as 16pt.

## Widths option

If you're doing your own font layout, you may want the width (horizontal advances) of each glyph to know how much to
offset each character by. Checking the "widths" toggle gives you the widths as variables to work with.

## Special spec usage (for fine control over font output)

By default, typing something like `abc` gives you parametrics `f_a(t)`, `f_b(t)`, `f_c(t)`; or lists `L_a`, `L_b`, `L_c` in polygon mode; and widths `W_a`, `W_b`, `W_c` if "widths" is enabled.

If you want more fine control over what is output, use spec mode, which is enabled by writing `polygon;` at the start of the input field. In this mode, the checkboxes are ignored ("polygon" is forced enabled, and "widths" is enabled by default).

In this mode, instead of writing text like `abc` to be written, you write a semicolon-separated list of name-text pairs. For example, you may write `caret=^` which gives you a list `L_{caret} = [...]` of points representing the string `^`, or `sin=sin` which gives you a list `L_{sin} = [...]` of points representing the string `sin`. The name needs to be letters and digits since it goes in a Desmos subscript. The text could be anything (except no semicolon).

As a full example, typing `polygon;caret=^;sin=sin;0=0;1=1` into the text field (and pressing "Extract text", once a font file is chosen) gives the contents of the folder in <https://www.desmos.com/calculator/z4cpvpbivu>. There is a point list `L_caret` representing the glyph `^`, and `W_caret` with the width of the character. There is a point list `L_sin` representing the three glyphs `sin` laid out horizontally, and `L_sin` being the total width of all three.

If you only want the list (and not the width), you can write `L_caret=^;`. If you only want the width (and not the list), you can write `W_caret=^;`. If you want both, write either `LW_caret=^;` or `caret=^;`.

## Tips

General tips:

- The parametrics are designed to take values of `t` from 0 to 1 and return points.
- Sometimes Desmos doesn't detect the fill properly. In most cases, setting the maximum value of `t` to something like 0.99999 would fix it.
- Values of `t` less than 0 will return the first point, while values of `t` greater than 1 will return the last point of the parametric.
- To access the individual coordinates of a parametric, you can use `p(t).x` or `p(t).y` in Desmos (assuming you assigned the parametric as `p(t) = {...}`).

## Limitations

The conversion process for SVGs works by using the [canvg](https://github.com/canvg/canvg) SVG renderer but swapping out a canvas context for a custom rendering canvas. In other words, it meets the full SVG spec, including transforms, colors, and more, with a few exceptions:

That being said, this script lacks support for:

- arcs and ellipses (I haven't gotten around to these)
- text and images embedded inside of SVGs
- path clipping (Very difficult to implement in Desmos)

## Development

```
nvm use 22
npm install
npm run dev
```

Then load `dist/svgToDesmos-dev.user.js` into Tampermonkey. It will automatically load the latest version of the userscript when you reload the page.
