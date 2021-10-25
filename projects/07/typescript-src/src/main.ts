import * as fs from "fs";
import { CodeWriter } from "./CodeWriter";
import { Parser } from "./Parser";

const targetPath = process.argv.slice(2)[0];

let targets: string[] = [];
if (fs.lstatSync(targetPath).isFile()) {
  if (!isVmFile(targetPath)) {
    throw new Error("targetPath is invalid");
  }
  targets = [targetPath];
} else {
  const files = fs.readdirSync(targetPath);
  const directory = targetPath.endsWith("/") ? targetPath : targetPath + "/";
  targets = files
    .filter((file) => isVmFile(file))
    .map((file) => {
      return `${directory}${file}`;
    });
}

// 対象ファイルがなかったら何もせずに終了
if (targets === undefined || targets.length == 0) {
  console.log("No target file found.");
  process.exit();
}

for (const target of targets) {
  const parser = new Parser(target);
  const writer = new CodeWriter(target);
  writer.setFileName(target);

  while (parser.hasMoreCommands()) {
    parser.advance();
    const commandType = parser.commandType();
    switch (commandType.name) {
      case "C_RETURN":
        break;
      case "C_ARITHMETIC":
        writer.writeArithmetic(parser.arg1());
        break;
      case "C_POP":
      case "C_PUSH":
        writer.writePushPop(commandType.name, parser.arg1(), parser.arg2());
        break;
      default:
        break;
    }
  }

  writer.close();
  console.log(`Finish VM transfer of ${target}`);
}

function isVmFile(path: string): boolean {
  return path.split(".").pop() === "vm";
}
