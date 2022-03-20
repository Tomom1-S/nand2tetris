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
  }

  async currentToken(): Promise<string> {
    return this.data[this.index];
  }

  async nextToken(): Promise<string> {
    if (this.index >= this.data.length) {
      return "";
    }
    return this.data[this.index + 1];
  }

  async tokenType(): Promise<TokenType> {
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

  async keyWord(): Promise<string> {
    const tokenType = await this.tokenType();
    if (tokenType !== "keyword") {
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

  async identifier(): Promise<string> {
    const tokenType = await this.tokenType();
    if (tokenType !== "identifier") {
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
    if (tokenType !== "integerConstant") {
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
