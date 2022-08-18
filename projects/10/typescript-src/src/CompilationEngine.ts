import * as fs from "fs";
import { Indentation } from "./Indentation";
import { JackTokenizer } from "./JackTokenizer";
import { operators, unaryOperators } from "./type";

const SEPARATOR = "\n";

export class CompilationEngine {
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
  private popResults(): string {
    const last = this.results.pop();
    const regexp = /<.*/g;
    const match = last?.match(regexp);
    if (!match) {
      return "";
    }
    return match[0];
  }

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
      (!(this.tokenizer.tokenType() === "symbol") ||
        !(this.tokenizer.symbol() === ";"))
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
    const tag = "subroutineDec";
    this.startBlock(tag);

    const type = this.tokenizer.tokenType();
    // <keyword> { constructor | function | method } </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);
    while (
      this.tokenizer.hasMoreTokens() &&
      (!(this.tokenizer.tokenType() === "symbol") ||
        !(this.tokenizer.symbol() === "}"))
    ) {
      if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileParameterList();
        continue;
      } else if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "{"
      ) {
        // { は subroutineBody の要素に入れる
        const last = this.popResults();
        this.startBlock("subroutineBody");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.pushResults(last!);
      }
      this.convertToken();
    }
    this.endBlock("subroutineBody");
    this.endBlock(tag);
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
      !(
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === ")"
      )
    ) {
      this.convertToken();
    }
    // ) は parameterList の要素に入れない
    const last = this.popResults();
    this.endBlock(tag);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.pushResults(last!);
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
      (!(this.tokenizer.tokenType() === "symbol") ||
        !(this.tokenizer.symbol() === ";"))
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

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    if (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.tokenType() !== "keyword"
    ) {
      this.tokenizer.advance();
    }

    let currentToken = this.tokenizer.keyWord();
    while (["do", "let", "while", "return", "if"].includes(currentToken)) {
      switch (currentToken) {
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
      currentToken = this.tokenizer.currentToken();
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

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.tokenType() !== "keyword"
    ) {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> do </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);
    while (
      this.tokenizer.hasMoreTokens() &&
      (!(this.tokenizer.tokenType() === "symbol") ||
        !(this.tokenizer.symbol() === ";"))
    ) {
      if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileExpressionList();
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

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    if (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.tokenType() !== "keyword"
    ) {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> let </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);
    while (
      this.tokenizer.hasMoreTokens() &&
      (!(this.tokenizer.tokenType() === "symbol") ||
        !(this.tokenizer.symbol() === ";"))
    ) {
      if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "["
      ) {
        this.compileExpression();
      } else if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "="
      ) {
        this.compileExpression();
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

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.tokenType() !== "keyword"
    ) {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> while </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    while (
      this.tokenizer.hasMoreTokens() &&
      (this.tokenizer.tokenType() !== "symbol" ||
        this.tokenizer.symbol() !== "}")
    ) {
      this.convertToken();
      if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileExpression();
      } else if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "{"
      ) {
        // {} 内の statements がなければ {} の間には何も入れない
        if (this.tokenizer.currentToken() === "}") {
          this.convertToken();
          this.endBlock(tag);
          return;
        }
        this.compileStatements();
        // <symbol> } </symbol>
        this.convertToken();
      }
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

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.tokenType() !== "keyword"
    ) {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> return </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    let currentToken = this.tokenizer.currentToken();
    while (currentToken !== ";") {
      this.compileExpression();
      currentToken = this.tokenizer.currentToken();
    }
    // <symbol> ; </symbol>
    this.convertToken();
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

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.tokenType() !== "keyword"
    ) {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword> if </keyword>
    this.pushResults(`<${type}> ${this.tokenizer.keyWord()} </${type}>`);

    let currentToken = this.tokenizer.currentToken();
    while (
      this.tokenizer.hasMoreTokens() &&
      !(
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "}" &&
        // } の後に else が続く場合は、if 文のコンパイルを続ける
        currentToken !== "else"
      )
    ) {
      if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "("
      ) {
        this.compileExpression();
      } else if (
        this.tokenizer.tokenType() === "symbol" &&
        this.tokenizer.symbol() === "{"
      ) {
        if (this.tokenizer.currentToken() === "}") {
          // {} 内の statements がなくても、statements のタグは入れる
          const t = "statements";
          this.startBlock(t);
          this.endBlock(t);
          // <symbol> } </symbol>
          this.convertToken();
        } else {
          this.compileStatements();
          // this.tokenizer.advance();
        }
      } else {
        this.convertToken();
      }
      currentToken = this.tokenizer.currentToken();
    }

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

    let count = 0;
    let currentToken = this.tokenizer.currentToken();
    while (
      this.tokenizer.hasMoreTokens() &&
      ![")", "]", ";", ","].includes(currentToken)
    ) {
      const type = this.tokenizer.tokenType();
      if (type === "keyword" || type === "symbol") {
        // expression の途中に出てくる演算子は、term に含まない
        if (count > 0 && operators.includes(currentToken)) {
          this.convertToken();
        }
        this.compileTerm();
      } else {
        this.convertToken();
      }
      currentToken = this.tokenizer.currentToken();
      count++;
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

    let currentToken = this.tokenizer.currentToken();
    // かっこ始まりの並びのとき、最後にかっこで閉じるための準備
    let endMark;
    switch (currentToken) {
      case "(":
        endMark = [")"];
        break;
      case "[":
        endMark = ["]"];
        break;
      default:
        endMark = [")", "]", ";", ","];
    }
    while (this.tokenizer.hasMoreTokens() && !endMark.includes(currentToken)) {
      if (this.tokenizer.tokenType() === "identifier") {
        switch (this.tokenizer.currentToken()) {
          case "[":
            // <symbol> [ </symbol>
            this.convertToken();
            this.compileExpression();
            break;
          case "(":
            // <symbol> ( </symbol>
            this.convertToken();
            this.compileExpressionList();
            break;
          case ".":
            break;
          default:
            // 配列、サブルーチン呼び出しではないとき
            this.endBlock(tag);
            return;
        }
      } else if (unaryOperators.includes(currentToken)) {
        this.convertToken();
        this.compileTerm();
        this.endBlock(tag);
        return;
      } else if (["(", "["].includes(currentToken)) {
        this.convertToken();
        this.compileExpression();
        this.convertToken();
        break;
      }
      this.convertToken();
      currentToken = this.tokenizer.currentToken();
    }
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

    let currentToken = this.tokenizer.currentToken();
    while (this.tokenizer.hasMoreTokens() && ![")"].includes(currentToken)) {
      if (currentToken === ",") {
        // <symbol> , </symbol>
        this.convertToken();
      } else {
        this.compileExpression();
      }
      currentToken = this.tokenizer.currentToken();
    }
    this.endBlock(tag);
  }
}
