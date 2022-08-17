import * as fs from "fs";
import { Indentation } from "./Indentation";
import { JackTokenizer } from "./JackTokenizer";
import { operators, unaryOperators } from "./type";

const SEPARATOR = "\n";

export class CompilationEngineTmp {
  tokenizer: JackTokenizer;
  outputPath: string;
  indentation = new Indentation();
  results: string[] = [];

  constructor(tokenizer: JackTokenizer, outputPath: string) {
    this.tokenizer = tokenizer;
    this.outputPath = outputPath;
  }

  private pushResults(value: string): void {
    this.results.push(`${this.indentation.spaces()}${value}`);
  }

  // FIXME: このメソッドを使わなくて済むように直す
  // private popResults(): string {
  //   const last = this.results.pop();
  //   const regexp = /<.*/g;
  //   const match = last?.match(regexp);
  //   if (!match) {
  //     return "";
  //   }
  //   return match[0];
  // }

  /**
   * 開始タグを挿入
   * @param tag
   */
  private startBlock(tag: string): void {
    this.pushResults(`<${tag}>`);
    this.indentation.indent();
  }

  /**
   * 終了タグを挿入
   * @param tag
   */
  private endBlock(tag: string): void {
    this.indentation.outdent();
    this.pushResults(`</${tag}>`);
  }

  /**
   * TokenType に応じてトークンを変換
   * @returns
   */
  convertToken(): void {
    if (!this.tokenizer.hasMoreTokens()) {
      return;
    }
    this.tokenizer.advance();

    const type = this.tokenizer.tokenType();
    let value;
    switch (type) {
      case "keyword":
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
          //   case "do":
          // case "let":
          //   case "while":
          //   case "return":
          //   case "if":
          // this.compileLet();
          // this.compileStatements();
          // return;
        }
        break;
      case "symbol":
        value = this.tokenizer.symbol();
        break;
      case "identifier":
        value = this.tokenizer.identifier();
        break;
      case "integerConstant":
        value = this.tokenizer.intVal();
        break;
      case "stringConstant":
        value = this.tokenizer.stringVal();
        break;
    }
    this.pushResults(`<${type}> ${value} </${type}>`);
  }

  /**
   * クラスをコンパイルする
   * [トークンの並び]
   * ’class’ className ’{’ classVarDec* subroutineDec* ’}’
   */
  compileClass(): void {
    const tag = "class";
    this.startBlock(tag);

    while (this.tokenizer.hasMoreTokens()) {
      this.convertToken();
    }
    this.endBlock(tag);
    this.pushResults("");

    fs.writeFileSync(this.outputPath, this.results.join(SEPARATOR));
    console.log(`Compiled: ${this.outputPath}`);
  }

  /**
   * スタティック宣言/フィールド宣言をコンパイルする
   * [トークンの並び]
   * (’static’ | ’field’) type varName (’,’ varName)* ’;’
   */
  compileClassVarDec(): void {
    const tag = "classVarDec";
    this.startBlock(tag);

    const type = this.tokenizer.tokenType();
    // <keyword> { static | field } </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      this.convertToken();
    }
    this.convertToken(); // ";" を出力

    this.endBlock(tag);
  }

  /**
   * メソッド/ファンクション/コンストラクタをコンパイルする
   * [トークンの並び]
   * (’constructor’ | ’function’ | ’method’) (’void’ | type) subroutineName ’(’ parameterList ’)’ subroutineBody
   */
  compileSubroutine(): void {
    const decTag = "subroutineDec";
    this.startBlock(decTag);
    const bodyTag = "subroutineBody";

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== "}"
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.convertToken(); // "(" を出力
        this.compileParameterList();
        continue;
      } else if (this.tokenizer.currentToken() === ")") {
        this.convertToken(); // ")" を出力
        this.startBlock(bodyTag);
        continue;
        // } else if (this.tokenizer.currentToken() === "{") {
        //   this.convertToken(); // "{" を出力
        //   // this.compileVarDec();
        //   continue;
      }

      this.convertToken();
    }
    this.convertToken(); // "}" を出力

    this.endBlock(bodyTag);
    this.endBlock(decTag);
  }

  /**
   * パラメータのリスト(空の可能性もある)をコンパイルする。カッコ“()”は含まない
   * [トークンの並び]
   * ((type varName) (’,’ type varName)*)?
   */
  compileParameterList(): void {
    const tag = "parameterList";
    this.startBlock(tag);

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ")"
    ) {
      this.convertToken();
    }

    this.endBlock(tag);
  }

  /**
   * var 宣言をコンパイルする
   * [トークンの並び]
   * ’var’ type varName (’,’ varName)* ’;’
   */
  compileVarDec(): void {
    const tag = "varDec";
    this.startBlock(tag);

    const type = this.tokenizer.tokenType();
    // <keyword> var </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);
    this.convertToken();
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      this.convertToken();
    }
    this.convertToken(); // ";" を出力

    this.endBlock(tag);
  }

  /**
   * var 宣言をコンパイルする
   * [statements のトークンの並び]
   * statement*
   * [statement のトークンの並び]
   * letStatement | ifStatement | whileStatement | doStatement | returnStatement
   */
  compileStatements(): void {
    const tag = "statements";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * do 文をコンパイルする
   * [トークンの並び]
   * ’do’ subroutineCall ’;’
   */
  compileDo(): void {
    const tag = "doStatement";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * let 文をコンパイルする
   * [トークンの並び]
   * ’let’ varName (’[’ expression ’]’)? ’=’ expression ’;’
   */
  compileLet(): void {
    const tag = "letStatement";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * while 文をコンパイルする
   * [トークンの並び]
   * ’while’ ’(’ expression ’)’ ’{’ statements ’}’
   */
  compileWhile(): void {
    const tag = "whileStatement";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * return 文をコンパイルする
   * [トークンの並び]
   * ’return’ expression? ’;’
   */
  compileReturn(): void {
    const tag = "returnStatement";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * if 文をコンパイルする。else 文を伴う可能性がある
   * [トークンの並び]
   * ’if’ ’(’ expression ’)’ ’{’ statements ’}’ (’else’ ’{’ statements ’}’)?
   */
  compileIf(): void {
    const tag = "ifStatement";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * 式をコンパイルする
   * [トークンの並び]
   * term (op term)*
   */
  compileExpression(): void {
    const tag = "expression";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * term をコンパイルする
   * [トークンの並び]
   * integerConstant | stringConstant | keywordConstant | varName | varName ’[’ expression ’]’ | subroutineCall | ’(’ expression ’)’ | unaryOp term
   */
  compileTerm(): void {
    const tag = "term";
    this.startBlock(tag);

    this.endBlock(tag);
  }

  /**
   * コンマで分離された式のリスト(空の可能性もある)をコンパイルする
   * [トークンの並び]
   * (expression (’,’ expression)* )?
   */
  compileExpressionList(): void {
    const tag = "expressionList";
    this.startBlock(tag);

    this.endBlock(tag);
  }
}
