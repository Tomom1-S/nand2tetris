import * as fs from "fs";
import { CommandType } from "./type";

export class Parser {
  data: string[];
  index = 0;
  command: string[] = [];

  constructor(filePath: string) {
    const file = fs.readFileSync(filePath, { encoding: "utf8" });
    this.data = file
      .toString()
      .split(/\r?\n/)
      .filter((line) => line) // 空行を除去
      .filter((line) => !line.startsWith("//")); // コメント行を削除
  }

  /**
   * 入力において、さらにコマンドが存在するか?
   * @returns コマンドが存在するか
   */
  hasMoreCommands(): boolean {
    if (!this.data) {
      return false;
    }
    return this.index < this.data.length;
  }

  /**
   * 入力から次のコマンドを読み、それを現在のコマンドにする
   */
  advance(): void {
    this.command = this.data[this.index++].split(" ");
  }

  /**
   * 現VMコマンドの種類を返す。算術コマンドはすべてC_ARITHMETICが返される。
   * @returns CommandType
   */
  commandType(): CommandType {
    switch (this.command[0]) {
      case "push":
        return {
          name: "C_PUSH",
          command: this.command[0],
        };
      case "pop":
        return {
          name: "C_POP",
          command: this.command[0],
        };
      case "add":
      case "sub":
      case "neg":
      case "eq":
      case "gt":
      case "lt":
      case "and":
      case "or":
      case "not":
        return {
          name: "C_ARITHMETIC",
          command: this.command[0],
        };
      case "label":
        return {
          name: "C_LABEL",
          command: this.command[0],
        };
      case "goto":
        return {
          name: "C_GOTO",
          command: this.command[0],
        };
      case "if-goto":
        return {
          name: "C_IF",
          command: this.command[0],
        };
      case "function":
        return {
          name: "C_FUNCTION",
          command: this.command[0],
        };
      case "return":
        return {
          name: "C_RETURN",
          command: this.command[0],
        };
      case "call":
        return {
          name: "C_CALL",
          command: this.command[0],
        }
    }
    throw new Error("Not assigned to any CommandType");
  }

  /**
   * 現コマンドの最初の引数が返される
   * C_ARITHMETICの場合、コマンド自体(add、subなど)が返される。
   * 現コマンドがC_RETURNの場合、本ルーチンは呼ばないようにする。
   * @returns 最初の引数
   */
  arg1(): string {
    if (this.commandType().name === "C_ARITHMETIC") {
      return this.command[0];
    }

    if (this.command.length < 2) {
      throw new Error(`No 1st argument found in "${this.command.join(" ")}"`);
    }
    return this.command[1];
  }

  /**
   * 現コマンドの2番目の引数が返される。
   * 現コマンドがC_PUSH、C_POP、C_FUNCTION、C_CALLの場合のみ本ルーチンを呼ぶようにする。
   * @returns 2番目の引数
   */
  arg2(): number {
    if (this.command.length < 3) {
      throw new Error(`No 2nd argument found in "${this.command.join(" ")}"`);
    }
    return parseInt(this.command[2]);
  }
}
