import * as fs from "fs";

export class CodeWriter {
  fileName: string;
  saveName: string;
  result = "";

  constructor(filepath: string) {
    console.log(filepath);
    this.saveName = `${filepath.substr(0, filepath.lastIndexOf("."))}.asm`;
  }

  setFileName(fileName: string): void {
    // TODO: CodeWriterモジュールに新しいVMファイルの変換が開始したことを知らせる
    this.fileName = fileName;
  }

  writeArithmetic(command: string): void {
    // TODO: 与えられた算術コマンドをアセンブリコードに変換し、それを書き込む
  }

  writePushPop(command: string, segment: string, index: number): void {
    // TODO: C_PUSHまたはC_POPコマンドをアセンブリコードに変換し、それを書き込む
    let asm;
    console.log(command);
    if (command === "push") {
      asm = convertPush(segment, index);
    } else {
      asm = ``;
    }
    this.result = `${this.result}${asm}\n`;
  }

  close(): void {
    fs.writeFile(this.saveName, this.result, (err) => {
      if (err) {
        throw err;
      }
    });
  }
}

function convertPush(segment: string, index: number): string {
  // 2. local、argument、this、that セグメントに対応する。
  // 3. 続いて、pointer と temp セグメントに対応する。特に、this と that セグメントのベースの修正ができるようにする。
  // 4. 最後に、static セグメントに対応する。
  switch (segment) {
    case "constant":
      return `@${index}\nD=A`;
    default:
      throw new Error("Invalid push segment.");
  }
}
