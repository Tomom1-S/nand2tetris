import * as fs from "fs";
import { CommandType } from "./CommandType";

export class Parser {
  regexComment = /^\/\/.*$/g;
  regexAcommand = /^@[A-z0-9_.$:]+( +\/\/.*)*$/g;
  regexCcommand = /^[AMD]*=?.+;?.*( +\/\/.*)*$/g;
  regexLcommand = /^\([A-z_.$:][A-z0-9_.$:]?\)( +\/\/.*)*$/g;
  regexSimpleLcommand = /\((.*?)?\)/;

  data: string[];
  index = 0;
  command = "";

  constructor(filePath: string) {
    const file = fs.readFileSync(filePath, { encoding: "utf8" });
    this.data = file.toString().split("\n");
  }

  hasMoreCommands(): boolean {
    if (!this.data || this.index >= this.data.length) {
      return false;
    }
    let line = this.data[this.index];
    while (this.index < this.data.length && (line === "" || line.match(this.regexComment))) {
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
   * 現コマンドの種類を返す
   * @returns
   * - A_COMMANDは@Xxxを意味し、Xxxはシンボルか10進数の数値である
   * - C_COMMANDはdest=comp;jumpを意味する
   * - L_COMMANDは擬似コマンドであり、(Xxx)を意味する。Xxxはシンボルである
   */
  commandType(): CommandType {
    if (this.command.match(this.regexAcommand)) {
      return CommandType.a;
    }
    if (this.command.match(this.regexLcommand)) {
      return CommandType.l
    }
    return CommandType.c;
  }

  /**
   * 現コマンド@Xxxまたは(Xxx)のXxxを返す
   * @returns シンボルまたは10進数の数値
   */
  symbol(): string {
    if (this.commandType() === CommandType.a) {
      return this.command.match(this.regexAcommand)![0].split(" ")[0].split("@")[1];
    }
    if (this.commandType() === CommandType.l) {
      return this.command.match(this.regexSimpleLcommand)![1];
    }

    throw new Error("symbol: Invalid command");
  }

  dest(): string {
    // TODO: 現 C 命令の dest ニーモニックを返 す(候補として 8 つの可能性がある)。 このルーチンは commandType() が C_COMMAND のときだけ呼ぶようにする
    return "dest";
  }

  comp(): string {
    // TODO: 現 C 命令の comp ニーモニックを返 す(候補として 28 個の可能性がある)。 このルーチンは commandType() が C_COMMAND のときだけ呼ぶようにする
    return "comp";
  }

  jump(): string {
    // TODO: 現 C 命令の jump ニーモニックを返 す(候補として 8 つの可能性がある)。 このルーチンは commandType() が C_COMMAND のときだけ呼ぶようにする
    return "jump";
  }
}
