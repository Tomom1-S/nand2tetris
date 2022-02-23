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

  /**
   * 開始タグを挿入
   * @param tag
   */
  private async startBlock(tag: string): Promise<void> {
    await this.pushResults(`<${tag}>`);
    await this.indentation.indent();
  }

  /**
   * 終了タグを挿入
   * @param tag
   */
  private async endBlock(tag: string): Promise<void> {
    await this.indentation.outdent();
    await this.pushResults(`</${tag}>`);
  }

  /**
   * TokenType に応じてトークンを変換
   * @returns
   */
  async convertToken(): Promise<void> {
    if (!(await this.tokenizer.hasMoreTokens())) {
      return;
    }
    await this.tokenizer.advance();

    const type = await this.tokenizer.tokenType();
    let value;
    switch (type) {
      case "keyword":
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
      case "symbol":
        value = await this.tokenizer.symbol();
        break;
      case "identifier":
        value = await this.tokenizer.identifier();
        break;
      case "integerConstant":
        value = await this.tokenizer.intVal();
        break;
      case "stringConstant":
        value = await this.tokenizer.stringVal();
        break;
    }
    await this.pushResults(`<${type}> ${value} </${type}>`);
  }

  /**
   * クラスをコンパイルする
   * [トークンの並び]
   * ’class’ className ’{’ classVarDec* subroutineDec* ’}’
   */
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

  /**
   * スタティック宣言/フィールド宣言をコンパイルする
   * [トークンの並び]
   * (’static’ | ’field’) type varName (’,’ varName)* ’;’
   */
  async compileClassVarDec(): Promise<void> {
    const tag = "classVarDec";
    await this.startBlock(tag);

    const type = await this.tokenizer.tokenType();
    // <keyword> { static | field } </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()) === "symbol") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  /**
   * メソッド/ファンクション/コンストラクタをコンパイルする
   * [トークンの並び]
   * (’constructor’ | ’function’ | ’method’) (’void’ | type) subroutineName ’(’ parameterList ’)’ subroutineBody
   */
  async compileSubroutine(): Promise<void> {
    const tag = "subroutineDec";
    await this.startBlock(tag);

    const type = await this.tokenizer.tokenType();
    // <keyword> { constructor | function | method } </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()) === "symbol") ||
        !((await this.tokenizer.symbol()) === "}"))
    ) {
      if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileParameterList();
      } else if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "{"
      ) {
        // { は subroutineBody の要素に入れる
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

  /**
   * パラメータのリスト(空の可能性もある)をコンパイルする。カッコ“()”は含まない
   * [トークンの並び]
   * ((type varName) (’,’ type varName)*)?
   */
  async compileParameterList(): Promise<void> {
    const tag = "parameterList";
    await this.startBlock(tag);

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      !(
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === ")"
      )
    ) {
      await this.convertToken();
    }
    // ) は parameterList の要素に入れない
    const last = await this.popResults();
    await this.endBlock(tag);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.pushResults(last!);
  }

  /**
   * var 宣言をコンパイルする
   * [トークンの並び]
   * ’var’ type varName (’,’ varName)* ’;’
   */
  async compileVarDec(): Promise<void> {
    const tag = "varDec";
    await this.startBlock(tag);

    const type = await this.tokenizer.tokenType();
    // <keyword> var </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()) === "symbol") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  /**
   * var 宣言をコンパイルする
   * [statements のトークンの並び]
   * statement*
   * [statement のトークンの並び]
   * letStatement | ifStatement | whileStatement | doStatement | returnStatement
   */
  async compileStatements(): Promise<void> {
    const tag = "statements";
    await this.startBlock(tag);

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    if (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()) !== "keyword"
    ) {
      await this.tokenizer.advance();
    }

    let currentToken = await this.tokenizer.keyWord();
    while (["do", "let", "while", "return", "if"].includes(currentToken)) {
      switch (currentToken) {
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
      currentToken = await this.tokenizer.currentToken();
    }
    await this.endBlock(tag);
  }

  /**
   * do 文をコンパイルする
   * [トークンの並び]
   * ’do’ subroutineCall ’;’
   */
  async compileDo(): Promise<void> {
    const tag = "doStatement";
    await this.startBlock(tag);

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()) !== "keyword"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    // <keyword> do </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()) === "symbol") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileExpressionList();
      }
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  /**
   * let 文をコンパイルする
   * [トークンの並び]
   * ’let’ varName (’[’ expression ’]’)? ’=’ expression ’;’
   */
  async compileLet(): Promise<void> {
    const tag = "letStatement";
    await this.startBlock(tag);

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    if (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()) !== "keyword"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    // <keyword> let </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (!((await this.tokenizer.tokenType()) === "symbol") ||
        !((await this.tokenizer.symbol()) === ";"))
    ) {
      if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "["
      ) {
        await this.compileExpression();
      } else if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "="
      ) {
        await this.compileExpression();
      }
      await this.convertToken();
    }
    await this.endBlock(tag);
  }

  /**
   * while 文をコンパイルする
   * [トークンの並び]
   * ’while’ ’(’ expression ’)’ ’{’ statements ’}’
   */
  async compileWhile(): Promise<void> {
    const tag = "whileStatement";
    await this.startBlock(tag);

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()) !== "keyword"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    // <keyword> while </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );

    while (
      (await this.tokenizer.hasMoreTokens()) &&
      ((await this.tokenizer.tokenType()) !== "symbol" ||
        (await this.tokenizer.symbol()) !== "}")
    ) {
      await this.convertToken();
      if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileExpression();
      } else if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "{"
      ) {
        // {} 内の statements がなければ {} の間には何も入れない
        if ((await this.tokenizer.currentToken()) === "}") {
          await this.convertToken();
          await this.endBlock(tag);
          return;
        }
        await this.compileStatements();
        // <symbol> } </symbol>
        await this.convertToken();
      }
    }
    await this.endBlock(tag);
  }

  /**
   * return 文をコンパイルする
   * [トークンの並び]
   * ’return’ expression? ’;’
   */
  async compileReturn(): Promise<void> {
    const tag = "returnStatement";
    await this.startBlock(tag);

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()) !== "keyword"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    // <keyword> return </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );

    let currentToken = await this.tokenizer.currentToken();
    while (currentToken !== ";") {
      await this.compileExpression();
      currentToken = await this.tokenizer.currentToken();
    }
    // <symbol> ; </symbol>
    await this.convertToken();
    await this.endBlock(tag);
  }

  /**
   * if 文をコンパイルする。else 文を伴う可能性がある
   * [トークンの並び]
   * ’if’ ’(’ expression ’)’ ’{’ statements ’}’ (’else’ ’{’ statements ’}’)?
   */
  async compileIf(): Promise<void> {
    const tag = "ifStatement";
    await this.startBlock(tag);

    // FIXME: JackTokenizer.keyWord() 呼び出しのため、適切なトークンまで進める
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      (await this.tokenizer.tokenType()) !== "keyword"
    ) {
      await this.tokenizer.advance();
    }

    const type = await this.tokenizer.tokenType();
    // <keyword> if </keyword>
    await this.pushResults(
      `<${type}> ${await this.tokenizer.keyWord()} </${type}>`
    );

    let currentToken = await this.tokenizer.currentToken();
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      !(
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "}" &&
        // } の後に else が続く場合は、if 文のコンパイルを続ける
        currentToken !== "else"
      )
    ) {
      if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "("
      ) {
        await this.compileExpression();
      } else if (
        (await this.tokenizer.tokenType()) === "symbol" &&
        (await this.tokenizer.symbol()) === "{"
      ) {
        if ((await this.tokenizer.currentToken()) === "}") {
          // {} 内の statements がなくても、statements のタグは入れる
          const t = "statements";
          await this.startBlock(t);
          await this.endBlock(t);
          // <symbol> } </symbol>
          await this.convertToken();
          continue;
        }
        await this.compileStatements();
      } else {
        await this.convertToken();
      }
      currentToken = await this.tokenizer.currentToken();
    }

    await this.endBlock(tag);
  }

  /**
   * 式をコンパイルする
   * [トークンの並び]
   * term (op term)*
   */
  async compileExpression(): Promise<void> {
    const tag = "expression";
    await this.startBlock(tag);

    let count = 0;
    let currentToken = await this.tokenizer.currentToken();
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      ![")", "]", ";", ","].includes(currentToken)
    ) {
      const type = await this.tokenizer.tokenType();
      if (type === "keyword" || type === "symbol") {
        // expression の途中に出てくる演算子は、term に含まない
        if (count > 0 && operators.includes(currentToken)) {
          await this.convertToken();
        }
        await this.compileTerm();
      } else {
        await this.convertToken();
      }
      currentToken = await this.tokenizer.currentToken();
      count++;
    }

    await this.endBlock(tag);
  }

  /**
   * term をコンパイルする
   * [トークンの並び]
   * integerConstant | stringConstant | keywordConstant | varName | varName ’[’ expression ’]’ | subroutineCall | ’(’ expression ’)’ | unaryOp term
   */
  async compileTerm(): Promise<void> {
    const tag = "term";
    await this.startBlock(tag);

    let currentToken = await this.tokenizer.currentToken();
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
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      !endMark.includes(currentToken)
    ) {
      if ((await this.tokenizer.tokenType()) === "identifier") {
        switch (await this.tokenizer.currentToken()) {
          case "[":
            // <symbol> [ </symbol>
            await this.convertToken();
            await this.compileExpression();
            break;
          case "(":
            // <symbol> ( </symbol>
            await this.convertToken();
            await this.compileExpressionList();
            break;
          case ".":
            break;
          default:
            // 配列、サブルーチン呼び出しではないとき
            await this.endBlock(tag);
            return;
        }
      } else if (unaryOperators.includes(currentToken)) {
        await this.convertToken();
        await this.compileTerm();
        await this.endBlock(tag);
        return;
      } else if (["(", "["].includes(currentToken)) {
        await this.convertToken();
        await this.compileExpression();
        await this.convertToken();
        break;
      }
      await this.convertToken();
      currentToken = await this.tokenizer.currentToken();
    }
    await this.endBlock(tag);
  }

  /**
   * コンマで分離された式のリスト(空の可能性もある)をコンパイルする
   * [トークンの並び]
   * (expression (’,’ expression)* )?
   */
  async compileExpressionList(): Promise<void> {
    const tag = "expressionList";
    await this.startBlock(tag);

    let currentToken = await this.tokenizer.currentToken();
    while (
      (await this.tokenizer.hasMoreTokens()) &&
      ![")"].includes(currentToken)
    ) {
      if (currentToken === ",") {
        // <symbol> , </symbol>
        await this.convertToken();
      } else {
        await this.compileExpression();
      }
      currentToken = await this.tokenizer.currentToken();
    }
    await this.endBlock(tag);
  }
}
