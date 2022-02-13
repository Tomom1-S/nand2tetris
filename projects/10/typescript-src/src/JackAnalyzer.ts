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
const engine = new CompilationEngine(
  target,
  `${parsedTarget.dir}/${parsedTarget.name}T.xml`
);

const results: string[] = [];
while (tokenizer.hasMoreTokens()) {
  tokenizer.advance();
  const type = tokenizer.tokenType();
  let value;
  switch (type.name) {
    case "KEYWORD":
      value = tokenizer.keyWord();
      break;
    case "SYMBOL":
      value = tokenizer.symbol();
      break;
    case "IDENTIFIER":
      value = tokenizer.identifier();
      break;
    case "INT_CONST":
      value = tokenizer.intVal();
      break;
    case "STRING_CONST":
      value = tokenizer.stringVal();
      break;
  }
  results.push(`<${type.tag}> ${value} </${type.tag}>`);
}

engine.close(results);
