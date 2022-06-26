import path from "path";
import * as fs from "fs";
import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";
import { VMWriter } from "./VMWriter";
import xml2js from "xml2js";
import { Command, Expression, operators } from "./type";

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

  const xmls = engine.results;
  const writer = new VMWriter(`${parsedTarget.dir}/${parsedTarget.name}.vm`);

  const parser = new xml2js.Parser();
  parser.parseString(engine.results, function (error, result) {
    if (error) {
      console.log(error.message);
    } else {
      console.log(result);
      const className = result.class.identifier[0].name;

      const cvDec = result.class.classVarDec;
      if (cvDec) {
        for (const c of cvDec) {
          console.log(`cvDec: ${JSON.stringify(c)}`);
        }
      }

      const sbDec = result.class.subroutineDec;
      if (sbDec) {
        for (const s of sbDec) {
          console.log(`sbDec: ${JSON.stringify(s)}`);
          const keywords = s.keyword;
          const sbType = keywords[0];
          const retType = keywords[1];
          console.log(`type: ${sbType}, ret: ${retType}`);

          const identifiers = s.identifier;
          const sbName = identifiers[0].name;
          console.log(`name: ${sbName}`);
          const symbols = s.symbol;
          console.log(symbols);
          const params = s.parameterList.filter((e: string) => {
            return e !== ",";
          });
          console.log(params);
          writer.writeFunction(`${className}.${sbName}`, params.length);

          for (const body of s.subroutineBody) {
            for (const st of body.statements) {
              // const doStatements = st.doStatement;
              const returnStatement = st.returnStatement;
              for (const doStmt of st.doStatement) {
                const exps = doStmt.expressionList[0].expression;
                console.log(`do: ${JSON.stringify(doStmt)}`);
                console.log(`expressionList: ${JSON.stringify(exps)}`);

                console.log(`exp:`);
                for (const exp of exps) {
                  compileExpression(writer, exp);
                }
                console.log(`exp end`);

                writer.writeCall(
                  `${doStmt.identifier[0]}.${doStmt.identifier[1]}`,
                  exps.length
                );
              }

              console.log(returnStatement);
            }
          }
          if (retType === "void") {
            writer.writePush("constant", 0);
          }
          writer.writeReturn();
        }
      }
    }
  });
  // console.log()
  // let line = 0;
  // const className;
  // while (line < xmls.length) {
  //   const xml = xmls[line];
  //   switch ()
  //   line++;
  // }
  writer.close();
}

function compileExpression(writer: VMWriter, expression: Expression) {
  const term = expression.term[0];
  const intConsts = term.integerConstant;
  const symbols = term.symbol;
  const subExps = term.expression;
  console.log(term);

  for (const intConst of intConsts) {
    writer.writePush("constant", intConst);
  }

  if (subExps) {
    for (const subExp of subExps) {
      compileExpression(writer, subExp);
    }
  }

  if (operators.includes(symbols[0])) {
    switch (symbols[0]) {
      case "+":
        writer.writeArithmetic("add");
        break;
      case "-":
        writer.writeArithmetic("sub");
        break;
      case "*":
        writer.writeCall("Math.multiply", 2);
        return;
      case "/":
        writer.writeCall("Math.divide", 2);
        return;
      case "&":
        writer.writeArithmetic("and");
        break;
      case "|":
        writer.writeArithmetic("or");
        break;
      case "<":
        writer.writeArithmetic("lt");
        break;
      case ">":
        writer.writeArithmetic("gt");
        break;
      case "=":
        writer.writeArithmetic("eq");
        break;
      default:
      // do nothing
    }
  }
}

function isJackFile(path: string): boolean {
  return path.split(".").pop() === "jack";
}
