// roundDigits only affects coefficients,
// so it could only affect the value by at most (10**-roundDigits)*t^k
// = 10**-roundDigits
// TODO: This should later be customizable by user
const roundDigits = 6; // round to 2 digits after decimal
// yes, this isn't perfectly precise because of limited float precision
export const epsilon = 0.1 ** roundDigits;

export function serializeFloat(x: number) {
  // we care about absolute precision, not relative precision
  const str = x.toFixed(roundDigits);
  // remove trailing 0s after a decimal point
  const match = str.match(/^([^e]*)(e.*)?$/);
  if (match !== null && match[1] !== undefined) {
    let outStr = match[1];
    while (/\.$|\..*0$/.test(outStr)) {
      outStr = outStr.slice(0, -1);
    }
    if (match[2] !== undefined && match[2] !== "") {
      outStr += match[2].replace("e", "*10^{") + "}";
    }
    return outStr || "0";
  } else {
    return str;
  }
}
