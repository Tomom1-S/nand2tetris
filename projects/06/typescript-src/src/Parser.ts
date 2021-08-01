import * as fs from "fs";


export class Parser {
  data: string;

  constructor(filePath: string) {
    fs.readFile(filePath, { encoding: "utf8" }, (err, file) => {
      if (err) {
        console.error(err.message);
        process.exit(1);
      }

      this.data = file;
      console.log(file);
    });
  }

  hasMoreCommands(): boolean {
    // TODO: 入力にまだコマンドが存在するか?
    return false;
  }

  advance(): void {
    // TODO: 入力から次のコマンドを読み、それを 現在のコマンドにする。このルーチンは hasMoreCommands() が true の場 合のみ呼ぶようにする。最初は現コマンド は空である
  }

  commandType(): CommandType {
    /* TODO: 現コマンドの種類を返す。
    - A_COMMAND は@Xxx を意味し、Xxx はシンボルか 10 進数の数値である
    - C_COMMANDはdest=comp;jump を意味する
    - L_COMMAND は擬似コマンドであり、 (Xxx) を意味する。Xxx はシンボル である */
    return CommandType.Accomand;
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
