import { keyWords, symbols, TokenType } from "./type";
import * as fs from "fs";

export class JackTokenizer {
  data: string[];
  index = 0;
  token: string;

  constructor(path: string) {
    const file = fs.readFileSync(path, { encoding: "utf8" });
    this.data = file
      .toString()
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // コメントを削除
      .split(/([{}()[\].,;+\-*/&|<>=~]|".*?"|\s+)/g) // トークン単位で分割
      .filter((line) => !line.match(/^\s+$/)) // スペースだけの行を除去
      .filter((line) => line) // 空行を除去
      .map((element) => {
        return element.replace(/"/g, "");
      });
    console.log(this.data);
  }

  hasMoreTokens(): boolean {
    if (!this.data) {
      return false;
    }
    return this.index < this.data.length;
  }

  advance(): void {
    if (!this.hasMoreTokens()) {
      throw Error(
        "JackTokenizer#advance shouldn't be called when hasMoreTokens returns false!"
      );
    }
    this.token = this.data[this.index++];
  }

  tokenType(): TokenType {
    if (keyWords.includes(this.token)) {
      return { name: "KEYWORD", tag: "keyword" };
    }
    if (symbols.includes(this.token)) {
      return { name: "SYMBOL", tag: "symbol" };
    }
    if (!isNaN(Number(this.token))) {
      return { name: "INT_CONST", tag: "integerConstant" };
    }
    if (this.token.match(/[A-z_][A-z0-9_]*$/)) {
      return { name: "IDENTIFIER", tag: "identifier" };
    }
    if (!this.token.includes('"') && !this.token.match(/\r?\n/)) {
      return { name: "STRING_CONST", tag: "stringConstant" };
    }
    throw Error(`Invalid token type: ${this.token}`);
  }

  keyWord(): { name: string; tag: string } {
    if (this.tokenType() !== { name: "KEYWORD", tag: "keyword" }) {
      throw Error(
        `Invalid token type for JackTokenizer#keyWord(): ${this.tokenType()}`
      );
    }
    let tag;
    switch (this.token) {
      case "class":
      case "constructor":
      case "function":
      case "method":
      case "field":
      case "static":
      case "int":
      case "char":
      case "boolean":
      case "void":
      case "true":
      case "false":
      case "null":
      case "this":
      case "else":
        tag = this.token;
        break;
      case "var":
        tag = "varDec";
        break;
      case "let":
        tag = "letStatement";
        break;
      case "do":
        tag = "doStatement";
        break;
      case "if":
        tag = "ifStatement";
        break;
      case "while":
        tag = "whileStatement";
        break;
      case "return":
        tag = "returnStatement";
        break;
      default:
        throw Error(`Invalid keyword: ${tag}`);
    }
    return { name: tag.toUpperCase(), tag };
  }

  symbol(): string {
    // TODO 現トークンの文字を返す。
    // このルーチンは、tokenType()がSYMBOLの場合のみ呼び出すことができる
    return "";
  }

  identifier(): string {
    // TODO 現トークンの識別子(identifier)を返す。
    // このルーチンは、tokenType()がIDENTIFIERの場合のみ呼び出すことができる
    return "";
  }

  intVal(): number {
    // TODO 現トークンの整数の値を返す。
    // このルーチンは、tokenType()がINT_CONSTの場合のみ呼び出すことができる
    return 0;
  }

  stringVal(): string {
    // TODO 現トークンの文字列を返す。
    // このルーチンは、tokenType()がSTRING_CONSTの場合のみ呼び出すことができる
    return "";
  }
}
