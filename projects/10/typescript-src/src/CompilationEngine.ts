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

  private pushResults(value: string) {
    this.results.push(`${this.indentation.spaces()}${value}`);
  }

  private popResults(): string {
    const last = this.results.pop();
    const regexp = /<.*/g;
    const match = last?.match(regexp);
    if (!match) {
      return "";
    }
    return match[0];
  }

  private startBlock(tag: string) {
    this.pushResults(`<${tag}>`);
    this.indentation.indent();
  }

  private endBlock(tag: string) {
    this.indentation.outdent();
    this.pushResults(`</${tag}>`);
  }

  convertToken(): void {
    this.tokenizer.advance();
    const type = this.tokenizer.tokenType();
    let value;
    switch (type.name) {
      case "KEYWORD":
        value = this.tokenizer.keyWord();
        switch (value) {
          case "constructor":
          case "function":
          case "method":
            this.compileSubroutine();
            return;
          case "field":
          case "static":
            this.compileClassVarDec();
            return;
          case "var":
            this.compileVarDec();
            return;
          case "do":
          case "let":
          case "while":
          case "return":
          case "if":
            this.compileStatements();
            return;
        }
        break;
      case "SYMBOL":
        value = this.tokenizer.symbol();
        break;
      case "IDENTIFIER":
        value = this.tokenizer.identifier();
        break;
      case "INT_CONST":
        value = this.tokenizer.intVal();
        break;
      case "STRING_CONST":
        value = this.tokenizer.stringVal();
        break;
    }
    this.pushResults(`<${type.tag}> ${value} </${type.tag}>`);
  }

  compileClass(): void {
    const tag = "class";
    this.startBlock(tag);

    while (this.tokenizer.hasMoreTokens()) {
      this.convertToken();
    }
    this.endBlock(tag);
    this.pushResults("");

    fs.writeFile(this.outputPath, this.results.join(SEPARATOR), (err) => {
      if (err) {
        throw err;
      }
    });
    console.log(`Compiled: ${this.outputPath}`);
  }

  compileClassVarDec(): void {
    const tag = "classVarDec";
    this.startBlock(tag);

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      !(this.tokenizer.tokenType().name === "SYMBOL") ||
      !(this.tokenizer.symbol() === ";")
    ) {
      this.convertToken();
    }
    this.endBlock(tag);
  }

  compileSubroutine(): void {
    // TODO メソッド、ファンクション、コンストラクタをコンパイルする
    const tag = "subroutineDec";
    this.startBlock(tag);

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      !(this.tokenizer.tokenType().name === "SYMBOL") ||
      !(this.tokenizer.symbol() === "}")
    ) {
      this.convertToken();
      if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileParameterList();
      } else if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "{"
      ) {
        const last = this.popResults();
        this.startBlock("subroutineBody");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.pushResults(last!);
      }
    }
    this.endBlock("subroutineBody");
    this.endBlock(tag);
  }

  compileParameterList(): void {
    // TODO パラメータのリスト(空の可能性もある)をコンパイルする。カッコ“()”は含まない
    const tag = "parameterList";
    this.startBlock(tag);

    while (
      !(this.tokenizer.tokenType().name === "SYMBOL") ||
      !(this.tokenizer.symbol() === ")")
    ) {
      this.convertToken();
    }
    const last = this.popResults();
    this.endBlock(tag);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.pushResults(last!);
  }

  compileVarDec(): void {
    const tag = "varDec";
    this.startBlock(tag);

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      !(this.tokenizer.tokenType().name === "SYMBOL") ||
      !(this.tokenizer.symbol() === ";")
    ) {
      this.convertToken();
    }
    this.endBlock(tag);
  }

  compileStatements(): void {
    if (this.tokenizer.tokenType().name !== "KEYWORD") {
      return;
    }

    const tag = "statements";
    this.startBlock(tag);

    let nextToken = this.tokenizer.keyWord();
    while (["do", "let", "while", "return", "if"].includes(nextToken)) {
      switch (nextToken) {
        case "do":
          this.compileDo();
          break;
        case "let":
          this.compileLet();
          break;
        case "while":
          this.compileWhile();
          break;
        case "return":
          this.compileReturn();
          break;
        case "if":
          this.compileIf();
          break;
      }
      nextToken = this.tokenizer.nextToken();
    }
    this.endBlock(tag);
  }

  compileDo(): void {
    const tag = "doStatement";
    this.startBlock(tag);

    if (this.tokenizer.tokenType().name !== "KEYWORD") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      !(this.tokenizer.tokenType().name === "SYMBOL") ||
      !(this.tokenizer.symbol() === ";")
    ) {
      if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileExpressionList();
      }
      this.convertToken();
    }
    this.endBlock(tag);
  }

  compileLet(): void {
    const tag = "letStatement";
    this.startBlock(tag);

    if (this.tokenizer.tokenType().name !== "KEYWORD") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );
    while (
      !(this.tokenizer.tokenType().name === "SYMBOL") ||
      !(this.tokenizer.symbol() === ";")
    ) {
      if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "="
      ) {
        this.compileExpression();
      }
      this.convertToken();
    }
    this.endBlock(tag);
  }

  compileWhile(): void {
    // TODO while 文をコンパイルする
    const tag = "whileStatement";
    this.startBlock(tag);

    if (this.tokenizer.tokenType().name !== "KEYWORD") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );

    while (
      this.tokenizer.hasMoreTokens() &&
      !(
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "}"
      )
    ) {
      this.convertToken();
      if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileExpression();
      } else if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "{"
      ) {
        if (this.tokenizer.nextToken() === "}") {
          const tag = "statements";
          this.startBlock(tag);
          this.endBlock(tag);
          this.convertToken();
          return;
        }
        this.compileStatements();
        this.convertToken();
      }
    }

    this.endBlock(tag);
  }

  compileReturn(): void {
    const tag = "returnStatement";
    this.startBlock(tag);

    if (this.tokenizer.tokenType().name !== "KEYWORD") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );

    let nextToken = this.tokenizer.nextToken();
    while (nextToken !== ";") {
      this.compileExpression();
      nextToken = this.tokenizer.nextToken();
    }
    this.convertToken();

    this.endBlock(tag);
  }

  compileIf(): void {
    const tag = "ifStatement";
    this.startBlock(tag);

    if (this.tokenizer.tokenType().name !== "KEYWORD") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    this.pushResults(
      `<${type.tag}> ${this.tokenizer.keyWord()} </${type.tag}>`
    );

    let nextToken = "";
    while (
      this.tokenizer.hasMoreTokens() &&
      !(
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "}" &&
        nextToken !== "else"
      )
    ) {
      this.convertToken();
      if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileExpression();
      } else if (
        this.tokenizer.tokenType().name === "SYMBOL" &&
        this.tokenizer.symbol() === "{"
      ) {
        if (this.tokenizer.nextToken() === "}") {
          const tag = "statements";
          this.startBlock(tag);
          this.endBlock(tag);
          this.convertToken();
        }
        this.compileStatements();
      }
      nextToken = this.tokenizer.nextToken();
    }
    this.endBlock(tag);
  }

  compileExpression(): void {
    const tag = "expression";
    this.startBlock(tag);

    this.compileTerm();

    this.endBlock(tag);
  }

  compileTerm(): void {
    // TODO termをコンパイルする。
    // このルーチンは、やや複雑であり、構文解析のルールには複数の選択肢が存在し、現トークンだけからは決定できない場合がある。
    // 具体的に言うと、もし現トークンが識別子であれば、このルーチンは、それが変数、配列宣言、サブルーチン呼び出しのいずれかを識別しなければならない。
    // そのためには、ひとつ先のトークンを読み込み、そのトークンが“[”か“(”か“.”のどれに該当するかを調べれば、現トークンの種類を決定することができる。
    // 他のトークンの場合は現トークンに含まないので、先読みを行う必要はない
    const tag = "term";
    this.startBlock(tag);

    this.convertToken();

    this.endBlock(tag);
  }

  compileExpressionList(): void {
    // TODO コンマで分離された式のリスト(空の可能性もある)をコンパイルする
    const tag = "expressionList";
    this.startBlock(tag);

    let nextToken = this.tokenizer.nextToken();
    while (
      this.tokenizer.hasMoreTokens() &&
      // this.tokenizer.tokenType().name === "SYMBOL" &&
      // this.tokenizer.symbol() === "," &&
      ![")"].includes(nextToken)
    ) {
      if (nextToken === ",") {
        this.convertToken();
      } else {
        this.compileExpression();
      }
      nextToken = this.tokenizer.nextToken();
    }

    this.endBlock(tag);
  }
}
