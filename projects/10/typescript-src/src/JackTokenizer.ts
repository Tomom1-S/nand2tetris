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

  async hasMoreTokens(): Promise<boolean> {
    if (!this.data) {
      return false;
    }
    return this.index < this.data.length;
  }

  async advance(): Promise<void> {
    if (!(await this.hasMoreTokens())) {
      throw Error(
        "JackTokenizer#advance shouldn't be called when hasMoreTokens returns false!"
      );
    }
    this.token = this.data[this.index++];
    console.log(`[L${this.index}] ${this.token}`);
  }

  async nextToken(): Promise<string> {
    if (this.index >= this.data.length) {
      return "";
    }
    return this.data[this.index];
  }

  async tokenType(): Promise<TokenType> {
    if (keyWords.includes(this.token)) {
      return { name: "KEYWORD", tag: "keyword" };
    }
    if (symbols.includes(this.token)) {
      return { name: "SYMBOL", tag: "symbol" };
    }
    if (!isNaN(Number(this.token))) {
      return { name: "INT_CONST", tag: "integerConstant" };
    }
    if (this.token.match(/^[A-z_][A-z0-9_\S]*$/)) {
      return { name: "IDENTIFIER", tag: "identifier" };
    }
    if (!this.token.includes('"') && !this.token.match(/\r?\n/)) {
      return { name: "STRING_CONST", tag: "stringConstant" };
    }
    throw Error(`Invalid token type: ${this.token}`);
  }

  async keyWord(): Promise<string> {
    const tokenType = await this.tokenType();
    if (tokenType.name !== "KEYWORD") {
      throw Error(
        `Invalid token type for JackTokenizer#keyWord(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    return this.token;
  }

  async symbol(): Promise<string> {
    const tokenType = await this.tokenType();
    if (tokenType.name !== "SYMBOL") {
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

  async identifier(): Promise<string> {
    const tokenType = await this.tokenType();
    if (tokenType.name !== "IDENTIFIER") {
      throw Error(
        `Invalid token type for JackTokenizer#identifier(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    return this.token;
  }

  async intVal(): Promise<number> {
    const tokenType = await this.tokenType();
    if (tokenType.name !== "INT_CONST") {
      throw Error(
        `Invalid token type for JackTokenizer#intVal():${JSON.stringify(
          tokenType
        )}`
      );
    }
    return Number(this.token);
  }

  async stringVal(): Promise<string> {
    const tokenType = await this.tokenType();
    if (tokenType.name !== "STRING_CONST") {
      throw Error(
        `Invalid token type for JackTokenizer#stringVal(): ${JSON.stringify(
          tokenType
        )}`
      );
    }
    return this.token;
  }
}
