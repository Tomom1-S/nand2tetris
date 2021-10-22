import * as fs from "fs";

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

console.log(targets);
// TODO: targets の各要素に対して処理を実行

function isVmFile(path: string): boolean {
  return path.split(".").pop() === "vm";
}
