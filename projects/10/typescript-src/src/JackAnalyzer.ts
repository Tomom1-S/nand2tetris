import path from "path";
import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";

const args = process.argv.slice(2);
const target = process.argv.slice(2)[0];
if (args.length === 0 || !target.endsWith(".jack")) {
  console.log("No target file specified.");
  process.exit();
}

const tokenizer = new JackTokenizer(target);
const parsedTarget = path.parse(target);
new CompilationEngine(
  tokenizer,
  `${parsedTarget.dir}/${parsedTarget.name}.xml`
);
