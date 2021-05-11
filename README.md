# SVG To Desmos

Yes, other SVG to Desmos scripts exist, but this one is special because it:

- operates directly in the browser
- is optimized to create **short, fast** parametrics using polynomial arithmetic and Horner's method
- **is designed with SVG font files in mind** (though it should work for most SVG files; see the Limitations section below)

## A few example graphs

- [Type Symbola Regular](https://www.desmos.com/calculator/hziliwoljn)
- [CMU Serif Upright Italic](https://www.desmos.com/calculator/fv29j8rirp) (font library)
- [CMU Serif Italic](https://www.desmos.com/calculator/h5bbvbpd9c) (font library)
- [Symbola Regular](https://www.desmos.com/calculator/bmz2bbrlkl) (font library)

## Why not use Desmos labels for fonts?

Labels cannot be skewed, so placing them in 3D does not work. Parametrics fix this by letting you use a projection function on their coordinates. See this [3D projection graph](https://www.reddit.com/r/desmos/comments/n80zjj/desmos_not_manim_quantum_mechanical_spin/) as an example.

Also, labels' size are relative to the graph viewport size in pixels, not math size, so zooming in on them leaves them as a constant size. Parametrics use math units to fix this problem.

## Usage

Skip the first two steps if you are not working from a font file.

1. Download a font as a TTF file (there's many websites for this, or you can google something like "Symbola Font TTF")
2. Convert the font to an SVG file using [Convertio](https://convertio.co/ttf-svg/) (I have not tested other services, but Convertio uses FontForge, which seems to be a fairly standard program)
3. After installing the TamperMonkey browser extension, install this userscript by opening [the latest release](https://github.com/jared-hughes/svgToDesmos/releases/latest/download/svgToDesmos.user.js) then clicking <kbd>Install</kbd>.

   - Disable the userscript when you don't need it because it currently messes with the user interface

4. I suggest testing on a blank graph
5. After reloading Desmos, you should now see a button that says <kbd>Choose File</kbd> under the graph's title
   - If you do not see it, try widening the left side panel.
   - Yes, the user interface is bad, but I'll probably improve it when (and if) I add this to [DesModder](https://chrome.google.com/webstore/detail/desmodder-for-desmos/eclmfdfimjhkmjglgdldedokjaemjfjp)
6. Click the <kbd>Choose File</kbd> button and select your SVG file
   - ⚠️ Warning: There is no confirmation! Make sure your graph is saved beforehand if you don't want to mess it up with a ton of parametrics.
   - There may be a bit of a delay with no visual indication. Just wait for it.
7. The parametrics should now be inserted, each one to its own folder and hidden by default. You probably want to look through and see which ones to un-hide. (tip: zoom out).
8. If you want to create a string of several letters, try running https://gist.github.com/jared-hughes/a52b1f0158fcda9acbf4775852a27761
   - That script collects the desired parametrics, calls them in order, and offsets them by (roughly) the correct values.
   - It does not take into account kerning and other factors, so the spacing might be off by a little, but in general it looks decent

## Tips

General tips:

- The parametrics are designed to take values of `t` from 0 to 1 and return points.
- Sometimes Desmos doesn't detect the fill properly. In most cases, setting the maximum value of `t` to something like 0.99999 would fix it.
- Values of `t` less than 0 will return the first point, while values of `t` greater than 1 will return the last point of the parametric.
- To access the individual coordinates of a parametric, you can use `p(t).x` or `p(t).y` in Desmos (assuming you assigned the parametric as `p(t) = {...}`).

For SVG Fonts:

- Press Ctrl+F to search through the folders for the character names you want
  - If you're searching for a letter, search for `j`, and the right letter is probably nearby.
- The points likely do not fit inside the viewport. Zoom out or multiply lengths by `1/2048` (or whatever `units-per-em` the `<font-face>` specifies) to get lengths in terms of `em`.
- If you're using generated parametrics as a font, keep in mind that the attribute `horiz-adv-x` tells the amount by which to increase the `x` value for the next character. You can do this, for example, with `(652, 0) + p(t)` for `horiz-adv-x=652` and parametric `p(t)`.
  - The `horiz-adv-x` defaults to the value given in `<font-face>`.

## Limitations

The conversion process does not follow the full SVG specification (which includes transforms, view boxes, and more). It just looks for elements with a `d` attribute (such as `<glyph d="M 1 2 L 3 4" />`) and injects those paths as a parametric.

I have not tested it on many different SVGs, though it seems to work consistently on SVGs generated from TTF files using Convertio.

That being said, this script lacks support for:

- colors
- arcs (the `A` and `a` commands)
- implicit repetition (e.g. `L 1 2 3 4` is the same as `L 1 2 L 3 4`)
