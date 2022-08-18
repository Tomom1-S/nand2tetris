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
          case "do":
          case "let":
          case "while":
          case "return":
          case "if":
            this.compileStatements();
            return;
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

    const type = this.tokenizer.tokenType();
    // <keyword> constructor/function/method </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.nextToken() !== "}"
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.compileParameterList();
        this.convertToken(); // ")" を出力
        continue;
      } else if (this.tokenizer.currentToken() === ")") {
        this.startBlock(bodyTag);
        this.convertToken(); // "{" を出力
        continue;
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
      this.tokenizer.nextToken() !== ")"
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
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      this.convertToken();
    }

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

    let token = this.tokenizer.currentToken();
    while (["do", "let", "while", "return", "if"].includes(token)) {
      switch (token) {
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
      token = this.tokenizer.nextToken();
    }
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

    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> do </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.compileExpressionList();
        this.convertToken(); // ")" を出力
        continue;
      }
      this.convertToken();
    }

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

    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> let </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      if (
        this.tokenizer.currentToken() === "[" ||
        this.tokenizer.currentToken() === "="
      ) {
        this.compileExpression();
        continue;
      }
      this.convertToken();
    }

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

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== "}"
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.compileExpression();
        this.convertToken(); // ")" を出力
        continue;
      } else if (this.tokenizer.currentToken() === ")") {
        this.convertToken(); // "{" を出力
        this.compileExpression();
        continue;
      }
      this.convertToken();
    }

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

    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> return </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.nextToken() !== ";"
    ) {
      this.compileExpression();
    }
    this.convertToken(); // ";"を出力

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

    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> if </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    while (
      this.tokenizer.hasMoreTokens() &&
      !(
        this.tokenizer.currentToken() === "}" &&
        this.tokenizer.nextToken() !== "else"
      )
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.compileExpression();
        this.convertToken(); // ")" を出力
        continue;
      } else if (this.tokenizer.currentToken() === ")") {
        this.convertToken(); // "{" を出力

        // TODO なおす
        this.convertToken();
        // this.compileStatements();
        continue;
      }
      this.convertToken();
    }

    // this.convertToken(); // "}"を出力
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

    this.compileTerm();
    while (
      this.tokenizer.hasMoreTokens() &&
      unaryOperators.includes(this.tokenizer.nextToken())
    ) {
      this.convertToken();
      this.compileTerm();
    }
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

    // let endMarks;
    // switch (this.tokenizer.nextToken()) {
    //   case "(":
    //     endMarks = [")"];
    //     break;
    //   case "[":
    //     endMarks = ["]"];
    //     break;
    //   default:
    //     endMarks = [")", "]", ";", ","];
    // }
    console.log(this.tokenizer.currentToken());
    while (this.tokenizer.hasMoreTokens()) {
      if (this.tokenizer.tokenType() === "identifier") {
        switch (this.tokenizer.nextToken()) {
          case "[":
            // 配列 varName ’[’ expression ’]’
            this.convertToken(); // "["を出力
            this.compileExpression();
            this.convertToken(); // "]"を出力
            break;
          case "(":
            // サブルーチン呼び出しの引数
            this.convertToken(); // "("を出力
            this.compileExpressionList();
            this.convertToken(); // ")"を出力
            break;
          case ".":
            // クラス、オブジェクトのサブルーチン呼び出し
            this.convertToken(); // "."を出力
            this.convertToken(); // クラス/オブジェクト名を出力
            this.convertToken(); // "("を出力
            this.compileExpressionList();
            this.convertToken(); // ")"を出力
            break;
          default:
            // 変数
            this.convertToken();
        }
        this.endBlock(tag);
        return;
      }
      if (unaryOperators.includes(this.tokenizer.currentToken())) {
        // unaryOp + term
        this.endBlock(tag);
        return;
      }
      // ’(’ expression ’)’
      if (this.tokenizer.nextToken() === "(") {
        this.convertToken(); // "("を出力
        this.compileExpression();
        this.convertToken(); // ")"を出力
        this.endBlock(tag);
        return;
      }

      this.convertToken();
    }

    // 一旦置き
    // while (!endMarks.includes(this.tokenizer.nextToken())) {
    //   switch (this.tokenizer.nextToken()) {
    //     case "[":
    //       this.convertToken(); // "["を出力
    //       this.compileExpression();
    //       this.convertToken(); // "]"を出力
    //       this.endBlock(tag);
    //       return;
    //     case "(":
    //       this.convertToken(); // "("を出力
    //       this.compileExpressionList();
    //       this.convertToken(); // ")"を出力
    //       this.endBlock(tag);
    //       return;
    //     case ".":
    //       this.convertToken(); // "."を出力
    //       this.convertToken(); // メソッド名を出力
    //       this.convertToken(); // "("を出力
    //       this.compileExpressionList();
    //       this.convertToken(); // ")"を出力
    //       break;
    //     default:
    //       if (unaryOperators.includes(this.tokenizer.nextToken())) {
    //         this.convertToken();
    //         this.compileTerm();
    //         this.endBlock(tag);
    //         return;
    //       } else {
    //         this.convertToken();
    //       }
    //   }
    // }

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

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.nextToken() !== ")"
    ) {
      if (this.tokenizer.nextToken() === ",") {
        this.convertToken();
        continue;
      }
      // FIXME ここまできてる
      this.compileExpression();
    }

    this.endBlock(tag);
  }
}
