import * as fs from "fs";
import { Indentation } from "./Indentation";
import { JackTokenizer } from "./JackTokenizer";
import { SymbolTable } from "./SymbolTable";
import {
  Command,
  operators,
  Segment,
  SymbolCategory,
  SymbolElement,
  unaryOperators,
} from "./type";
import { VMWriter } from "./VMWriter";

const SEPARATOR = "\n";

export class CompilationEngine {
  tokenizer: JackTokenizer;
  symbolTable: SymbolTable;
  writer: VMWriter;
  outputPath: string;
  indentation = new Indentation();
  results: string[] = [];
  vmResults: string[] = [];

  labelCount: {
    while: number;
    if: number;
  };
  id: { cat: SymbolCategory; type?: string } | undefined;
  className: string;
  subroutineData:
    | {
        className: string;
        functionName?: string;
        argNums: number;
        lclNums: number;
      }
    | undefined;
  returnVoid: boolean;
  symbolElement: SymbolElement;
  letData: {
    leftSide: boolean;
    target: {
      segment: Segment;
      index: number;
    } | null;
  };
  stackPop: boolean; // true: pop, false: push
  ops: string[] = []; // 文中の演算子をスタック形式で保持

  constructor(tokenizer: JackTokenizer, writer: VMWriter, outputPath: string) {
    this.tokenizer = tokenizer;
    this.writer = writer;
    this.outputPath = outputPath;

    this.symbolTable = new SymbolTable();

    this.labelCount = {
      while: 0,
      if: 0,
    };
  }

  private pushResults(value: string): void {
    // this.results.push(value);
    this.results.push(`${this.indentation.spaces()}${value}`);
  }

  /**
   * 開始タグを挿入
   * @param tag
   */
  private startBlock(tag: string): void {
    this.pushResults(`<${tag}>`);
    // this.indentation.indent();
  }

  /**
   * 終了タグを挿入
   * @param tag
   */
  private endBlock(tag: string): void {
    // this.indentation.outdent();
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
          case "class":
            this.id = { cat: "class" };
            this.compileClass();
            return;
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
        // その他のキーワードの場合、変数/返り値の型になる
        if (value === "void") {
          this.returnVoid = true;
        } else if (value === "true") {
          this.writer.writePush("constant", 1);
          this.writer.writeArithmetic("neg");
        } else if (value === "false") {
          this.writer.writePush("constant", 0);
        } else if (typeof this.id !== "undefined") {
          this.id.type = value;
        }
        break;
      case "symbol":
        value = this.tokenizer.symbol();
        if (this.id && value === ";") {
          this.id.type = undefined;
        }
        // 文の終了時に、積み上げておいた演算子を破棄
        if (value === ";") {
          this.ops = [];
        }
        switch (value) {
          case "+":
          case "-":
          case "*":
          case "/":
          case "&":
          case "|":
          case "<":
          case ">":
          case "=":
          case "~":
            this.ops.push(value);
            break;
        }
        break;
      case "identifier": {
        value = this.tokenizer.identifier();

        const cat = this.symbolTable.kindOf(value);
        if (typeof this.id === "undefined" && cat !== "none") {
          // identifierの情報が集まっていないが、シンボルテーブルに登録済みの場合
          let segment: Segment;
          switch (cat) {
            case "argument":
            case "static":
              segment = cat;
              break;
            case "field":
              segment = "this";
              break;
            case "var":
              segment = "local";
              break;
          }
          // push / pop を判断したい
          if (this.stackPop) {
            // this.writer.writePop(segment, this.symbolTable.indexOf(value));
            this.letData.target = {
              segment,
              index: this.symbolTable.indexOf(value),
            };
          } else {
            this.writer.writePush(segment, this.symbolTable.indexOf(value));
          }
        } else if (typeof this.id === "undefined") {
          // identifierの情報が集まっていなくて、シンボルテーブルに未登録の場合
          // 関数呼び出し
          if (typeof this.subroutineData === "undefined") {
            this.subroutineData = { className: value, argNums: 0, lclNums: 0 };
          } else {
            this.subroutineData.functionName = value;
          }
          break;
        } else if (cat === "none" && this.id.cat === "class") {
          // クラス名のとき
          this.className = value;
        } else if (cat === "none" && this.id.cat === "subroutine") {
          // サブルーチン名のとき
          this.subroutineData = {
            className: this.className,
            functionName: value,
            argNums: 0,
            lclNums: 0,
          };
        } else if (cat === "none" && typeof this.id.type === "undefined") {
          // 変数の型の情報がない場合、型を一時的に記録
          this.id.type = value;
          break;
        } else if (
          cat === "none" &&
          this.id.cat !== "class" &&
          this.id.cat !== "subroutine"
        ) {
          // シンボルテーブルに登録されていない場合
          this.symbolTable.define(value, this.id.type!, this.id.cat);
          // サブルーチンの引数は、型と変数が一対一で対応するので型情報を消す
          if (this.id.cat === "argument") {
            this.id.type = undefined;
          }
        }
        break;
      }
      case "integerConstant":
        value = this.tokenizer.intVal();
        this.writer.writePush("constant", value);
        break;
      case "stringConstant":
        value = this.tokenizer.stringVal();
        break;
    }
    this.pushResults(`<${type}>${value}</${type}>`);
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

    // id の情報が不要になったので id をクリア
    this.id = undefined;

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

    const keyWord = this.tokenizer.keyWord();
    if (keyWord !== "field" && keyWord !== "static") {
      throw new Error(`${keyWord}: invalid keyWord`);
    }
    const type = this.tokenizer.tokenType();
    // <keyword>{ static | field }</keyword>
    this.pushResults(`<${type}>${keyWord}</${type}>`);

    this.id = {
      cat: keyWord,
    };

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      this.convertToken();
    }

    this.endBlock(tag);

    // id の情報が不要になったので id をクリア
    this.id = undefined;
  }

  /**
   * メソッド/ファンクション/コンストラクタをコンパイルする
   * [トークンの並び]
   * (’constructor’ | ’function’ | ’method’) (’void’ | type) subroutineName ’(’ parameterList ’)’ subroutineBody
   */
  compileSubroutine(): void {
    // FIXME methodのときは引数が k+1 個になる

    this.symbolTable.startSubroutine();
    this.id = { cat: "subroutine" };

    const decTag = "subroutineDec";
    this.startBlock(decTag);
    const bodyTag = "subroutineBody";

    const type = this.tokenizer.tokenType();
    // <keyword>constructor/function/method</keyword>
    this.pushResults(`<${type}>${this.tokenizer.keyWord()}</${type}>`);

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

        if (this.tokenizer.nextToken() === "var") {
          continue;
        }
        if (!this.subroutineData) {
          throw new Error("subroutineData is incomplete");
        }
        this.writer.writeFunction(
          `${this.subroutineData.className}.${this.subroutineData.functionName}`,
          this.subroutineData.lclNums
        );
        this.subroutineData = undefined;
        continue;
      }
      this.convertToken();
    }
    this.convertToken(); // "}" を出力
    this.endBlock(bodyTag);
    this.endBlock(decTag);

    // id の情報が不要になったので id をクリア
    this.id = undefined;
  }

  /**
   * パラメータのリスト(空の可能性もある)をコンパイルする。カッコ“()”は含まない
   * [トークンの並び]
   * ((type varName) (’,’ type varName)*)?
   */
  compileParameterList(): void {
    // id の情報が不要になったので id をクリア
    this.id = {
      cat: "argument",
    };

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.nextToken() !== ")"
    ) {
      this.convertToken();
    }

    this.id = undefined;
  }

  /**
   * var 宣言をコンパイルする
   * [トークンの並び]
   * ’var’ type varName (’,’ varName)* ’;’
   */
  compileVarDec(): void {
    const keyWord = this.tokenizer.keyWord();
    if (keyWord !== "var") {
      throw new Error(`${keyWord}: invalid keyWord`);
    }
    const type = this.tokenizer.tokenType();
    // <keyword>var</keyword>
    this.pushResults(`<${type}>${keyWord}</${type}>`);

    this.id = {
      cat: keyWord,
    };

    let count = 0;
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      this.convertToken();
      count++;
    }

    if (!this.subroutineData) {
      throw new Error("subroutineData is incomplete");
    }
    this.subroutineData.lclNums =
      this.subroutineData.lclNums + Math.floor(count / 2);
    if (this.tokenizer.nextToken() === "var") {
      return;
    }

    this.writer.writeFunction(
      `${this.subroutineData.className}.${this.subroutineData.functionName}`,
      this.subroutineData.lclNums
    );
    this.subroutineData = undefined;

    // id の情報が不要になったので id をクリア
    this.id = undefined;
  }

  /**
   * 一連の文をコンパイルする。波カッコ“{}”は含まない
   * [statements のトークンの並び]
   * statement*
   * [statement のトークンの並び]
   * letStatement | ifStatement | whileStatement | doStatement | returnStatement
   */
  compileStatements(): void {
    const tag = "statements";
    this.startBlock(tag);

    // FIXME? 適切な場所までトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

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
    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const type = this.tokenizer.tokenType();
    // <keyword>do</keyword>
    this.pushResults(`<${type}>${this.tokenizer.keyWord()}</${type}>`);

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

    if (!this.subroutineData) {
      throw new Error("subroutineData is incomplete");
    }
    this.writer.writeCall(
      `${this.subroutineData.className}.${this.subroutineData.functionName}`,
      this.subroutineData.argNums
    );
    this.subroutineData = undefined;
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
    // <keyword>let</keyword>
    this.pushResults(`<${type}>${this.tokenizer.keyWord()}</${type}>`);

    this.letData = { leftSide: true, target: null };
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== ";"
    ) {
      if (
        this.tokenizer.currentToken() === "[" ||
        this.tokenizer.currentToken() === "="
      ) {
        if (this.tokenizer.currentToken() === "=") {
          this.letData.leftSide = false;
        }
        if (!this.letData.leftSide) {
          this.stackPop = false;
        }
        // TODO 右辺で関数呼び出しをする場合の処理をしたい
        this.compileExpression();
        continue;
      }
      if (this.letData.leftSide) {
        this.stackPop = true;
      }
      this.convertToken();
    }
    this.stackPop = false;

    if (this.letData.target) {
      this.writer.writePop(
        this.letData.target.segment,
        this.letData.target.index
      );
    }

    this.endBlock(tag);
  }

  /**
   * while 文をコンパイルする
   * [トークンの並び]
   * ’while’ ’(’ expression ’)’ ’{’ statements ’}’
   */
  compileWhile(): void {
    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const count = this.labelCount.while++;

    const type = this.tokenizer.tokenType();
    // <keyword>while</keyword>
    this.pushResults(`<${type}>${this.tokenizer.keyWord()}</${type}>`);

    this.writer.writeLabel(`WHILE_EXP${count}`);
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.currentToken() !== "}"
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.compileExpression();
        this.convertToken(); // ")" を出力

        // while の条件に反していたら、while 文の後に飛ぶ
        this.writer.writeArithmetic("not");
        this.writer.writeIf(`WHILE_END${count}`);
        continue;
      } else if (this.tokenizer.currentToken() === ")") {
        this.convertToken(); // "{" を出力

        this.compileStatements();
        this.convertToken(); // "}" を出力
        this.writer.writeGoto(`WHILE_EXP${count}`);
        continue;
      }
      this.convertToken();
    }
    this.writer.writeLabel(`WHILE_END${count}`);
  }

  /**
   * return 文をコンパイルする
   * [トークンの並び]
   * ’return’ expression? ’;’
   */
  compileReturn(): void {
    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.nextToken() !== ";"
    ) {
      this.compileExpression();
    }

    // 返り値がないときは定数0を返す
    if (this.returnVoid) {
      this.writer.writePush("constant", 0);
    }
    this.writer.writeReturn();
    this.returnVoid = false;
  }

  /**
   * if 文をコンパイルする。else 文を伴う可能性がある
   * [トークンの並び]
   * ’if’ ’(’ expression ’)’ ’{’ statements ’}’ (’else’ ’{’ statements ’}’)?
   */
  compileIf(): void {
    // statement が2つ以上連続するときに、";"からトークンを進める
    if (this.tokenizer.tokenType() !== "keyword") {
      this.tokenizer.advance();
    }

    const count = this.labelCount.if++;
    let includesElse = false;
    while (
      this.tokenizer.hasMoreTokens() &&
      (this.tokenizer.currentToken() !== "}" ||
        (this.tokenizer.currentToken() === "}" &&
          this.tokenizer.nextToken() === "else"))
    ) {
      if (this.tokenizer.currentToken() === "(") {
        this.compileExpression();
        this.convertToken(); // ")" を出力
        continue;
      }
      if (this.tokenizer.currentToken() === ")") {
        this.writer.writeIf(`IF_TRUE${count}`);
        this.writer.writeGoto(`IF_FALSE${count}`);
        this.writer.writeLabel(`IF_TRUE${count}`);
        this.convertToken(); // "{" を出力
        this.compileStatements();
        this.convertToken(); // "}" を出力
        continue;
      }
      if (this.tokenizer.currentToken() === "else") {
        includesElse = true;
        this.writer.writeGoto(`IF_END${count}`);
        this.writer.writeLabel(`IF_FALSE${count}`);
      }
      this.convertToken();
    }

    if (!includesElse) {
      this.writer.writeLabel(`IF_FALSE${count}`);
    } else {
      this.writer.writeLabel(`IF_END${count}`);
    }
  }

  /**
   * 式をコンパイルする
   * [トークンの並び]
   * term (op term)*
   */
  compileExpression(): void {
    this.compileTerm();
    while (
      this.tokenizer.hasMoreTokens() &&
      operators.includes(this.tokenizer.nextToken())
    ) {
      this.convertToken();
      this.compileTerm();

      this.passOperator();
    }
    // TODO 最後に結果をstackの一番上に入れる?
  }

  /**
   * 識別子をVMWriterに渡す
   */
  passOperator(): void {
    let command: Command;
    switch (this.ops.pop()) {
      case "*":
        this.writer.writeCall("Math.multiply", 2);
        return;
      case "/":
        this.writer.writeCall("Math.divide", 2);
        return;
      case "+":
        command = "add";
        break;
      case "-":
        command = "sub";
        break;
      case "&":
        command = "and";
        break;
      case "|":
        command = "or";
        break;
      case "<":
        command = "lt";
        break;
      case ">":
        command = "gt";
        break;
      case "=":
        command = "eq";
        break;
      default:
        throw new Error(`${this.ops}: Invalid operator`);
    }
    this.writer.writeArithmetic(command);
  }

  /**
   * term をコンパイルする
   * [トークンの並び]
   * integerConstant | stringConstant | keywordConstant | varName | varName ’[’ expression ’]’ | subroutineCall | ’(’ expression ’)’ | unaryOp term
   */
  compileTerm(): void {
    this.convertToken();

    if (this.tokenizer.tokenType() === "identifier") {
      switch (this.tokenizer.nextToken()) {
        case "[":
          // 配列 varName ’[’ expression ’]’
          this.convertToken(); // "["
          this.compileExpression();
          this.convertToken(); // "]"
          break;
        case ".":
          // クラス、オブジェクトのサブルーチン呼び出し
          this.convertToken(); // "."
          this.convertToken(); // クラス/オブジェクト名
          this.convertToken(); // "("
          this.compileExpressionList();
          this.convertToken(); // ")"
          if (this.subroutineData) {
            this.writer.writeCall(
              `${this.subroutineData.className}.${this.subroutineData?.functionName}`,
              this.subroutineData.argNums
            );
            this.subroutineData = undefined;
          }
          break;
        default:
        // 変数のときは何もしない
      }
      return;
    }
    // unaryOp + term
    if (unaryOperators.includes(this.tokenizer.currentToken())) {
      // this.convertToken(); // unaryOp
      this.compileTerm();
      // this.endBlock(tag);
      let command: Command;
      switch (this.ops.pop()) {
        case "-":
          command = "neg";
          break;
        case "~":
          command = "not";
          break;
        default:
          throw new Error(`${this.ops}: Invalid unaryOp`);
      }
      this.writer.writeArithmetic(command);
      return;
    }
    // ’(’ expression ’)’
    if (this.tokenizer.currentToken() === "(") {
      // this.convertToken(); // "("を出力
      this.compileExpression();
      this.convertToken(); // ")"を出力
      return;
    }
  }

  /**
   * コンマで分離された式のリスト(空の可能性もある)をコンパイルする
   * [トークンの並び]
   * (expression (’,’ expression)* )?
   */
  compileExpressionList(): void {
    let count = 0;
    while (
      this.tokenizer.hasMoreTokens() &&
      this.tokenizer.nextToken() !== ")"
    ) {
      if (this.tokenizer.nextToken() === ",") {
        this.convertToken();
        continue;
      }
      this.compileExpression();
      count++;
    }

    if (!this.subroutineData) {
      throw new Error("subroutineData is incomplete");
    }
    this.subroutineData.argNums = count;
  }

  /**
   * 演算子の記号をコマンド名に変換
   * @param op 演算子
   * @returns 演算子のコマンド
   */
  private getCommand(op: string): Command {
    switch (op) {
      case "+":
        return "add";
      case "-":
        return "sub";
      case "&":
        return "and";
      case "|":
        return "or";
      case "<":
        return "lt";
      case ">":
        return "gt";
      case "=":
        return "eq";
      default:
        throw new Error("_getCommand: Invalid operator");
    }
  }
}
