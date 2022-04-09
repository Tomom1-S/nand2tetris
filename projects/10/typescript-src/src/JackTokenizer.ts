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
    console.log(`[L${this.index}] ${this.token}`);
  }

  currentToken(): string {
    return this.data[this.index];
  }

  nextToken(): string {
    if (this.index >= this.data.length) {
      return "";
    }
    return this.data[this.index + 1];
  }

  tokenType(): TokenType {
    if (keyWords.includes(this.token)) {
      return "keyword";
    }
    if (symbols.includes(this.token)) {
      return "symbol";
    }
    if (!isNaN(Number(this.token))) {
      return "integerConstant";
    }
    if (this.token.match(/^[A-z_][A-z0-9_\S]*$/)) {
      return "identifier";
    }
    if (!this.token.includes('"') && !this.token.match(/\r?\n/)) {
      return "stringConstant";
    }
    throw Error(`Invalid token type: ${this.token}`);
  }

  keyWord(): string {
    const tokenType = this.tokenType();
    if (tokenType !== "keyword") {
      throw Error(
        `Invalid token type for JackTokenizer#keyWord(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    return this.token;
  }

  symbol(): string {
    const tokenType = this.tokenType();
    if (tokenType !== "symbol") {
      throw Error(
        `Invalid token type for JackTokenizer#symbol(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    switch (this.token) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      default:
        return this.token;
    }
  }

  identifier(): string {
    const tokenType = this.tokenType();
    if (tokenType !== "identifier") {
      throw Error(
        `Invalid token type for JackTokenizer#identifier(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    return this.token;
  }

  intVal(): number {
    const tokenType = this.tokenType();
    if (tokenType !== "integerConstant") {
      throw Error(
        `Invalid token type for JackTokenizer#intVal():${JSON.stringify(
          tokenType
        )}`
      );
    }
    return Number(this.token);
  }

  stringVal(): string {
    const tokenType = this.tokenType();
    if (tokenType !== "stringConstant") {
      throw Error(
        `Invalid token type for JackTokenizer#stringVal(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    return this.token;
  }
}
