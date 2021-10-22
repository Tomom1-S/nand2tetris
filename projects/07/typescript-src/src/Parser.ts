import * as fs from "fs";
import { CommandType } from "./CommandType";

export class Parser {
  data: string[];
  index = 0;
  command = "";

  constructor(filePath: string) {
    const file = fs.readFileSync(filePath, { encoding: "utf8" });
    this.data = file.toString().split(/\r?\n/);
  }

  hasMoreCommands(): boolean {
    if (!this.data || this.index >= this.data.length) {
      return false;
    }
    let line = this.data[this.index];
    while (this.index < this.data.length && line === "") {
      line = this.data[++this.index];
    }
    return this.index < this.data.length;
  }

  /**
   * 入力から次のコマンドを読み、それを現在のコマンドにする
   */
  advance(): void {
    this.command = this.data[this.index++];
  }

  /**
   * 現VMコマンドの種類を返す。算術コマンドはすべてC_ARITHMETICが返される。
   * @returns CommandType
   */
  commandType(): CommandType {
    // TODO: コマンドの種類の判別
    return CommandType.arithmetic;
    // throw new Error("Not assigned to any CommandType")
  }

  /**
   * 現コマンドの最初の引数が返される
   * C_ARITHMETICの場合、コマンド自体(add、subなど)が返される。
   * 現コマンドがC_RETURNの場合、本ルーチンは呼ばないようにする。
   * @returns 最初の引数
   */
  arg1(): string {
    // TODO: 最初の引数を取り出す
    return "";
  }

  /**
   * 現コマンドの2番目の引数が返される。
   * 現コマンドがC_PUSH、C_POP、C_FUNCTION、C_CALLの場合のみ本ルーチンを呼ぶようにする。
   * @returns 2番目の引数
   */
  arg2(): number {
    // TODO: 2番目の引数を取り出す
    return 0;
  }
}
