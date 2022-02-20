import * as fs from "fs";
import { Indentation } from "./Indentation";
import { JackTokenizer } from "./JackTokenizer";

const SEPARATOR = "\n";
export class CompilationEngine {
  tokenizer: JackTokenizer;
  outputPath: string;
  indentation = new Indentation();
  results: string[] = [];

  constructor(tokenizer: JackTokenizer, outputPath: string) {
    // TODO 与えられた入力と出力に対して 新しいコンパイルエンジンを生成する。
    // 次に呼ぶルーチンはcompileClass()でなければならない
    this.tokenizer = tokenizer;
    this.outputPath = outputPath;
  }

  private async pushResults(value: string): Promise<void> {
    this.results.push(`${this.indentation.spaces()}${value}`);
    console.log(`${this.indentation.spaces()}${value}`);
  }

  private async popResults(): Promise<string> {
    const last = this.results.pop();
    const regexp = /<.*/g;
    const match = last?.match(regexp);
    if (!match) {
      return "";
    }
    return match[0];
  }

  private async startBlock(tag: string): Promise<void> {
    await this.pushResults(`<${tag}>`);
    await this.indentation.indent();
  }

  private async endBlock(tag: string): Promise<void> {
    await this.indentation.outdent();
    await this.pushResults(`</${tag}>`);
  }

  async convertToken(): Promise<void> {
    if (!(await this.tokenizer.hasMoreTokens())) {
      return;
    }
    await this.tokenizer.advance();
    const type = await this.tokenizer.tokenType();
    let value;
    switch (type.name) {
      case "KEYWORD":
        value = await this.tokenizer.keyWord();
        switch (value) {
          case "constructor":
          case "function":
          case "method":
            await this.compileSubroutine();
            return;
          case "field":
          case "static":
            await this.compileClassVarDec();
            return;
          case "var":
            await this.compileVarDec();
            return;
          case "do":
          case "let":
          case "while":
          case "return":
          case "if":
            await this.compileStatements();
            return;
        }
        break;
      case "SYMBOL":
        value = await this.tokenizer.symbol();
        break;
      case "IDENTIFIER":
        value = await this.tokenizer.identifier();
        break;
      case "INT_CONST":
        value = await this.tokenizer.intVal();
        break;
      case "STRING_CONST":
        value = await this.tokenizer.stringVal();
        break;
    }
    await this.pushResults(`<${type.tag}> ${value} </${type.tag}>`);
  }

  async compileClass(): Promise<void> {
    const tag = "class";
    await this.startBlock(tag);

    while (await this.tokenizer.hasMoreTokens()) {
      await this.convertToken();
    }
    await this.endBlock(tag);
    await this.pushResults("");

    fs.writeFile(this.outputPath, this.results.join(SEPARATOR), (err) => {
      if (err) {
        throw err;
      }
    });
    console.log(`Compiled: ${this.outputPath}`);
  }

  async compileClassVarDec(): Promise<void> {
    const tag = "classVarDec";
    await this.startBlock(tag);

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()).name === "SYMBOL") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  async compileSubroutine(): Promise<void> {
    // TODO メソッド、ファンクション、コンストラクタをコンパイルする
    const tag = "subroutineDec";
    await this.startBlock(tag);

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()).name === "SYMBOL") ||
        !((await this.tokenizer.symbol()) === "}"))
    ) {
      if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileParameterList();
      } else if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "{"
      ) {
        const last = await this.popResults();
        await this.startBlock("subroutineBody");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.pushResults(last!);
        await this.convertToken();
      } else {
        await this.convertToken();
      }
    }
    await this.endBlock("subroutineBody");

    await this.endBlock(tag);
  }

  async compileParameterList(): Promise<void> {
    const tag = "parameterList";
    await this.startBlock(tag);

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      !(
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === ")"
      )
    ) {
      await this.convertToken();
    }
    const last = await this.popResults();
    await this.endBlock(tag);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.pushResults(last!);
  }

  async compileVarDec(): Promise<void> {
    const tag = "varDec";
    await this.startBlock(tag);

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()).name === "SYMBOL") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  async compileStatements(): Promise<void> {
    const tag = "statements";
    await this.startBlock(tag);

    if (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()).name !== "KEYWORD"
    ) {
      await this.tokenizer.advance();
    }

    let nextToken = await this.tokenizer.keyWord();
    while (["do", "let", "while", "return", "if"].includes(nextToken)) {
      switch (nextToken) {
        case "do":
          await this.compileDo();
          break;
        case "let":
          await this.compileLet();
          break;
        case "while":
          await this.compileWhile();
          break;
        case "return":
          await this.compileReturn();
          break;
        case "if":
          await this.compileIf();
          break;
      }
      nextToken = await this.tokenizer.nextToken();
    }
    await this.endBlock(tag);
  }

  async compileDo(): Promise<void> {
    const tag = "doStatement";
    await this.startBlock(tag);

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()).name !== "KEYWORD"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()).name === "SYMBOL") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileExpressionList();
      }
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  async compileLet(): Promise<void> {
    const tag = "letStatement";
    await this.startBlock(tag);

    if (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()).name !== "KEYWORD"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()).name === "SYMBOL") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "="
      ) {
        await this.compileExpression();
      }
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  async compileWhile(): Promise<void> {
    const tag = "whileStatement";
    await this.startBlock(tag);

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()).name !== "KEYWORD"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      ((await this.tokenizer.tokenType()).name !== "SYMBOL" ||
        (await this.tokenizer.symbol()) !== "}")
    ) {
      await this.convertToken();
      if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileExpression();
      } else if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "{"
      ) {
        if ((await this.tokenizer.nextToken()) === "}") {
          await this.convertToken();
          await this.endBlock(tag);
          return;
        }
        await this.compileStatements();
        await this.convertToken();
      }
    }
    await this.endBlock(tag);
  }

  async compileReturn(): Promise<void> {
    const tag = "returnStatement";
    await this.startBlock(tag);

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()).name !== "KEYWORD"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );

    let nextToken = await this.tokenizer.nextToken();
    while (nextToken !== ";") {
      await this.compileExpression();
      nextToken = await this.tokenizer.nextToken();
    }
    await this.convertToken();

    await this.endBlock(tag);
  }

  async compileIf(): Promise<void> {
    const tag = "ifStatement";
    await this.startBlock(tag);

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()).name !== "KEYWORD"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    await this.pushResults(
      `<${type.tag}> ${await this.tokenizer.keyWord()} </${type.tag}>`
    );

    let nextToken = "";
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      !(
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "}" &&
        nextToken !== "else"
      )
    ) {
      if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileExpression();
      } else if (
        (await this.tokenizer.tokenType()).name === "SYMBOL" &&
        (await this.tokenizer.symbol()) === "{"
      ) {
        if ((await this.tokenizer.nextToken()) === "}") {
          await this.convertToken();
          await this.endBlock(tag);
          return;
        }
        await this.compileStatements();
      } else {
        await this.convertToken();
      }
      nextToken = await this.tokenizer.nextToken();
    }

    await this.endBlock(tag);
  }

  async compileExpression(): Promise<void> {
    const tag = "expression";
    await this.startBlock(tag);

    await this.compileTerm();

    await this.endBlock(tag);
  }

  async compileTerm(): Promise<void> {
    // TODO termをコンパイルする。
    // このルーチンは、やや複雑であり、構文解析のルールには複数の選択肢が存在し、現トークンだけからは決定できない場合がある。
    // 具体的に言うと、もし現トークンが識別子であれば、このルーチンは、それが変数、配列宣言、サブルーチン呼び出しのいずれかを識別しなければならない。
    // そのためには、ひとつ先のトークンを読み込み、そのトークンが“[”か“(”か“.”のどれに該当するかを調べれば、現トークンの種類を決定することができる。
    // 他のトークンの場合は現トークンに含まないので、先読みを行う必要はない
    const tag = "term";
    await this.startBlock(tag);

    let nextToken = await this.tokenizer.nextToken();
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      ![")"].includes(nextToken)
    ) {
      await this.convertToken();
      nextToken = await this.tokenizer.nextToken();
    }

    await this.convertToken();
    await this.endBlock(tag);
  }

  async compileExpressionList(): Promise<void> {
    // TODO コンマで分離された式のリスト(空の可能性もある)をコンパイルする
    const tag = "expressionList";
    await this.startBlock(tag);

    let nextToken = await this.tokenizer.nextToken();
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      ![")"].includes(nextToken)
    ) {
      if (nextToken === ",") {
        await this.convertToken();
      } else {
        await this.compileExpression();
      }
      nextToken = await this.tokenizer.nextToken();
    }

    await this.endBlock(tag);
  }
}
