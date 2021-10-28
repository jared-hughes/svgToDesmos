import commandsTable from "./commandsTable";

const commandChars = new Set("MLHVCSQTAZmlhvcsqtaz");
const numberChars = new Set("0123456789.-eE");

export interface CommandWithArgs {
  command: string;
  args: number[];
}

export function parsePath(path: string) {
  let currentCommand: string | null = null;
  let currentArguments: number[] = [];
  let currentNum = "";
  const commands: CommandWithArgs[] = [];
  function closeCommand() {
    if (currentCommand !== null) {
      commands.push({
        command: currentCommand,
        args: currentArguments,
      });
      // If a moveto is followed by multiple pairs of coordinates, the subsequent pairs are treated as implicit lineto commands.
      if (currentCommand === "m") {
        currentCommand = "l";
      } else if (currentCommand === "M") {
        currentCommand = "L";
      }
    }
    currentArguments = [];
  }
  function closeNumber() {
    if (currentNum === "") {
      return;
    }
    const num = parseFloat(currentNum);
    // note that this does not catch malformed numbers like "12.-34"
    if (isNaN(num)) {
      throw new Error(`Encountered NaN "${currentNum}" while parsing ${path}`);
    }
    currentArguments.push(num);
    currentNum = "";
    if (
      currentCommand &&
      commandsTable[currentCommand.toUpperCase()]?.args.length ===
        currentArguments.length
    ) {
      closeCommand();
    }
  }
  for (const char of path) {
    if (char === "-") {
      // "L123-456" is valid syntax which should be parsed equivalently to "L 123 -456"
      closeNumber();
    }
    if (commandChars.has(char)) {
      closeNumber();
      currentCommand = char;
    } else if (numberChars.has(char)) {
      currentNum += char;
    } else {
      // assume it's something like a space or a comma
      closeNumber();
    }
  }
  closeNumber();
  return commands;
}
