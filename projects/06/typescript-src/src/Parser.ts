import * as fs from "fs";
import { CommandType } from "./CommandType";

export class Parser {
  // reader;
  data: string[];
  index = 0;
  command = "";

  regexComment = /^\/\/.*$/g;
  regexAcommand = /^@[A-z0-9_.$:]+( +\/\/.*)*$/g;
  regexCcommand = /^[AMD]*=?.+;?.*( +\/\/.*)*$/g;
  regexLcommand = /^[(][A-z_.$:][A-z0-9_.$:]+[)]+( +\/\/.*)*$/g;

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

  advance(): void {
    // TODO: 入力から次のコマンドを読み、それを 現在のコマンドにする。このルーチンは hasMoreCommands() が true の場 合のみ呼ぶようにする。最初は現コマンド は空である
    this.command = this.data[this.index++];
  }

  commandType(): CommandType {
    /* TODO: 現コマンドの種類を返す。
    - A_COMMAND は@Xxx を意味し、Xxx はシンボルか 10 進数の数値である
    - C_COMMANDはdest=comp;jump を意味する
    - L_COMMAND は擬似コマンドであり、 (Xxx) を意味する。Xxx はシンボル である */
    if (this.command.match(this.regexAcommand)) {
      return CommandType.a;
    }
    if (this.command.match(this.regexLcommand)) {
      return CommandType.l
    }
    return CommandType.c;
  }

  symbol(): string {
    // TODO: 現コマンド@Xxx または (Xxx) の Xxx を返す。Xxx はシンボルまたは 10 進数の数値である。このルーチンは commandType() が A_COMMAND ま たは L_COMMAND のときだけ呼ぶように する
    return "dummy";
  }

  dest(): string {
    // TODO: 現 C 命令の dest ニーモニックを返 す(候補として 8 つの可能性がある)。 このルーチンは commandType() が C_COMMAND のときだけ呼ぶようにする
    return "dummy";
  }

  comp(): string {
    // TODO: 現 C 命令の comp ニーモニックを返 す(候補として 28 個の可能性がある)。 このルーチンは commandType() が C_COMMAND のときだけ呼ぶようにする
    return "dummy";
  }

  jump(): string {
    // TODO: 現 C 命令の jump ニーモニックを返 す(候補として 8 つの可能性がある)。 このルーチンは commandType() が C_COMMAND のときだけ呼ぶようにする
    return "dummy";
  }
}
