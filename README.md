# SVG To Desmos

Yes, other SVG to Desmos scripts exist, but this one is special because it:

- operates directly in the browser
- is optimized to create **short, fast** parametrics using polynomial arithmetic and Horner's method
- **is designed with SVG font files in mind** (though it should work for most SVG files; see the Limitations section below)

## A few example font graphs

- [Dancing Script](https://www.desmos.com/calculator/rtpmycwixz)
- [Lobster Regular](https://www.desmos.com/calculator/29ozjnu3aw)
- [Devil Breeze](https://www.desmos.com/calculator/sjkcsnakab)
- [Nunito](https://www.desmos.com/calculator/nmgtmamleb)

## Why not use Desmos labels for fonts?

Labels cannot be skewed, so placing them in 3D does not work. Parametrics fix this by letting you use a projection function on their coordinates. See this [3D projection graph](https://www.reddit.com/r/desmos/comments/n80zjj/desmos_not_manim_quantum_mechanical_spin/) as an example.

Also, labels' size are relative to the graph viewport size in pixels, not math size, so zooming changes their size relative to other distances. Parametrics use math units to fix this problem.

## Installation

After installing the TamperMonkey browser extension, install this userscript by opening [the latest release](https://github.com/jared-hughes/svgToDesmos/releases/latest/download/svgToDesmos.user.js) then clicking <kbd>Install</kbd>.

- after reloading Desmos, the buttons should appear at the top

- You probably want to disable the userscript when you don't need it :)

## Usage for general SVGs

1. Start from a blank graph to avoid messing up a graph with a ton of a parametrics
2. Use the <kbd>Choose File</kbd> button labelled with "SVG," and select your SVG file, then click "insert SVG"
3. The parametrics should now be inserted, each one to its own folder and hidden by default. You probably want to look through and un-hide many. (tip: zoom out).

## Usage for font files

1. Obtain a font file, such as [Google fonts](https://fonts.google.com)
   - I've tested with TTF files, and Opentype (the font library that svgToDesmos uses) should support TTF, WOFF, and OTF files.
2. Load a font through the <kbd>Choose File</kbd> button labelled "Font."
3. Put text in the input box below the button, then click "Extract text."
4. The text should be inserted. Each individual glyph is its own function in the "Parametric glyph definitions" folder, and these are displayed in the "Render string" folder

## Tips

General tips:

- The parametrics are designed to take values of `t` from 0 to 1 and return points.
- Sometimes Desmos doesn't detect the fill properly. In most cases, setting the maximum value of `t` to something like 0.99999 would fix it.
- Values of `t` less than 0 will return the first point, while values of `t` greater than 1 will return the last point of the parametric.
- To access the individual coordinates of a parametric, you can use `p(t).x` or `p(t).y` in Desmos (assuming you assigned the parametric as `p(t) = {...}`).

## Limitations

The conversion process for SVGs does not follow the full SVG specification (which includes transforms, view boxes, and more). It just looks for elements with a `d` attribute (such as `<glyph d="M 1 2 L 3 4" />`) and injects those paths as a parametric.

That being said, this script lacks support for:

- colors
- arcs (the `A` and `a` commands)
- SVG transforms, etc.
