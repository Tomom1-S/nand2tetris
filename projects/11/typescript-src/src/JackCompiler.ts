import path from "path";
import * as fs from "fs";
import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";
import { VMWriter } from "./VMWriter";
import xml2js from "xml2js";
import { Expression, operators } from "./type";

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
  const writer = new VMWriter(`${parsedTarget.dir}/${parsedTarget.name}.vm`);
  const engine = new CompilationEngine(
    tokenizer,
    writer,
    `${parsedTarget.dir}/${parsedTarget.name}.xml`
  );
  engine.convertToken();

  /*
  const parser = new xml2js.Parser();
  parser.parseString(engine.results, function (error, result) {
    if (error) {
      throw new Error(error.message);
    }

    const className = result.class.identifier[0];

    // クラス変数の定義
    const cvDec = result.class.classVarDec;
    if (cvDec) {
      // TODO なんかする
    }

    const sbDec = result.class.subroutineDec;
    if (sbDec) {
      for (const s of sbDec) {
        const keywords = s.keyword;
        const sbType = keywords[0];
        const retType = keywords[1];
        // console.log(`type: ${sbType}, ret: ${retType}`);

        const identifiers = s.identifier;
        const sbName = identifiers[0];
        const symbols = s.symbol;
        // console.log(symbols);
        const params = s.parameterList.filter((e: string) => {
          return e !== ",";
        });
        // console.log(params);
        writer.writeFunction(`${className}.${sbName}`, params.length);

        for (const body of s.subroutineBody) {
          for (const st of body.statements) {
            const returnStatement = st.returnStatement;
            if (typeof st.doStatement === "undefined") {
              continue;
            }
            for (const doStmt of st.doStatement) {
              const exps = doStmt.expressionList[0].expression;
              // console.log(`do: ${JSON.stringify(doStmt)}`);
              // console.log(`expressionList: ${JSON.stringify(exps)}`);

              for (const exp of exps) {
                compileExpression(writer, exp);
              }

              writer.writeCall(
                `${doStmt.identifier[0]}.${doStmt.identifier[1]}`,
                exps.length
              );
            }
          }
        }

        if (retType === "void") {
          writer.writePush("constant", 0);
        } else {
          // TODO void 以外のリターン文
        }
        writer.writeReturn();
      }
    }
  });
  */

  writer.close();
}

function compileExpression(writer: VMWriter, expression: Expression) {
  const term = expression.term[0];
  const intConsts = term.integerConstant;
  const symbols = term.symbol;
  const subExps = term.expression;
  // console.log(term);

  if (typeof intConsts !== "undefined") {
    for (const intConst of intConsts) {
      writer.writePush("constant", intConst);
    }
  }

  if (typeof subExps !== "undefined") {
    if (subExps) {
      for (const subExp of subExps) {
        compileExpression(writer, subExp);
      }
    }
  }

  if (typeof symbols !== "undefined" && operators.includes(symbols[0])) {
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
