import * as fs from "fs";

export class CodeWriter {
  fileName: string;

  constructor(filePath: string) {
    // TODO: 出力ファイル/ストリームを開き、書き込む準備を行う
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
  }

  close(): void {
    // TODO: 出力ファイルを閉じる
  }
}
