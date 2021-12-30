import * as fs from "fs";
import "./CommandType";

export class Parser {
  regexComment = /^ *\/\/.*$/;
  regexAcommand = /^ *@(?<label>[A-z0-9_.$:]+) *(\/\/.*)*$/;
  regexCcommand = /^ *(?<dest>[AMD]*)=?(?<comp>[AMD01\+\-\!&|]+);?(?<jump>[A-Z]*) *(\/\/.*)*$/;
  regexLcommand = /^ *\((?<label>[A-z_.$:][A-z0-9_.$:]*)\) *(\/\/.*)*$/;

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
      return { name: "A_COMMAND" };
    }
    if (this.command.match(this.regexLcommand)) {
      return { name: "L_COMMAND" };
    }
    if (this.command.match(this.regexCcommand)) {
      return { name: "C_COMMAND" };
    }
    throw new Error("Not assigned to any CommandType")
  }

  /**
   * 現コマンド@Xxxまたは(Xxx)のXxxを返す
   * @returns シンボルまたは10進数の数値
   */
  symbol(): string {
    let label: string | undefined;
    switch (this.commandType().name) {
      case "A_COMMAND":
        label = this.regexAcommand.exec(this.command)?.groups?.label;
        break;
      case "L_COMMAND":
        label = this.regexLcommand.exec(this.command)?.groups?.label;
        break;
      default:
        throw new Error("symbol: Invalid command");
    }
    if (label) {
      return label;
    }
    throw new Error("symbol: Not found");
  }

  /**
   * 現C命令のdestニーモニックを返す
   * @returns destニーモニック
   */
  dest(): string {
    const dest = this.regexCcommand.exec(this.command)?.groups?.dest;
    if (dest) {
      return dest;
    }
    return "null";
  }

  /**
   * 現C命令のcompニーモニックを返す
   * @returns compニーモニック
   */
  comp(): string {
    const comp = this.regexCcommand.exec(this.command)?.groups?.comp;
    if (comp) {
      return comp;
    }
    throw new Error("comp: Not found");
  }

  /**
   * 現C命令のjumpニーモニックを返す
   * @returns jumpニーモニック
   */
  jump(): string {
    const jump = this.regexCcommand.exec(this.command)?.groups?.jump;
    if (jump) {
      return jump;
    }
    return "null";
  }
}
