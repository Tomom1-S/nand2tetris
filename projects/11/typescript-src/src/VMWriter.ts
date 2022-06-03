import * as fs from "fs";
import * as path from "path";
import { Command, Segment } from "./type";

const SEPARATOR = "\n";

export class VMWriter {
  saveName: string;
  results: string[] = [];

  // FIXME 8章演習からのコピー
  constructor(filepath: string) {
    const parsedPath = path.parse(filepath);
    const saveDir = fs.lstatSync(filepath).isFile()
      ? parsedPath.dir
      : `${parsedPath.dir}/${parsedPath.name}`;
    this.saveName = `${saveDir}/${parsedPath.name}.vm`;
  }

  writePush(segment: Segment, index: number): void {
    // pushコマンドを書く
  }

  writePop(segment: Segment, index: number): void {
    // popコマンドを書く
  }

  writeArithmetic(command: Command): void {
    // 算術コマンドを書く
  }

  writeLabel(label: string): void {
    // labelコマンドを書く
  }

  writeGoto(label: string): void {
    // gotoコマンドを書く
  }

  writeIf(label: string): void {
    // If-gotoコマンドを書く
  }

  writeCall(name: string, nArgs: number): void {
    // callコマンドを書く
  }

  writeFunction(name: string, nLocals: number): void {
    // functionコマンドを書く
  }

  writeReturn(): void {
    // returnコマンドを書く
  }

  // FIXME 8章演習からのコピー
  close(): void {
    // 出力ファイルを閉じる

    fs.writeFile(this.saveName, this.results.join(SEPARATOR), (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
