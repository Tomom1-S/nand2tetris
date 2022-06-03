import path from "path";
import * as fs from "fs";
import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";

const targetPath = process.argv.slice(2)[0];

let targets: string[] = [];
if (fs.lstatSync(targetPath).isFile()) {
  if (!isJackFile(targetPath)) {
    throw new Error("targetPath is invalid");
  }
  targets = [targetPath];
} else {
  const files = fs.readdirSync(targetPath);
  const directory = targetPath.endsWith("/") ? targetPath : targetPath + "/";
  targets = files
    .filter((file) => isJackFile(file))
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
  const tokenizer = new JackTokenizer(target);
  const parsedTarget = path.parse(target);
  const engine = new CompilationEngine(
    tokenizer,
    `${parsedTarget.dir}/${parsedTarget.name}.xml`
  );
  engine.compileClass();
}

function isJackFile(path: string): boolean {
  return path.split(".").pop() === "jack";
}
