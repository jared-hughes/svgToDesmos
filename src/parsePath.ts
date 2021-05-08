const commandChars = new Set("MLHVCSQTAZmlhvcsqtaz");
const numberChars = new Set("0123456789.-");

interface CommandWithArgs {
  command: string;
  args: number[];
}

export function parsePath(path: string) {
  let currentCommand: string | null = null;
  let currentArguments: number[] = [];
  let currentNum = "";
  const commands: CommandWithArgs[] = [];
  function closeCommand() {
    closeNumber();
    if (currentCommand !== null) {
      commands.push({
        command: currentCommand,
        args: currentArguments,
      });
    }
    currentCommand = null;
    currentArguments = [];
    currentNum = "";
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
  }
  for (const char of path) {
    if (commandChars.has(char)) {
      closeCommand();
      currentCommand = char;
    } else if (numberChars.has(char)) {
      currentNum += char;
    } else {
      // assume it's something like a space or a comma
      closeNumber();
    }
  }
  closeCommand();
  return commands;
}
