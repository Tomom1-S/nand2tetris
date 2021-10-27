import * as fs from "fs";

export class CodeWriter {
  fileName: string;
  saveName: string;
  labelCount = 0;
  result = "";

  static readonly POP_TOP = "@SP\nAM=M-1\nD=M\n";

  constructor(filepath: string) {
    this.saveName = `${filepath.substr(0, filepath.lastIndexOf("."))}.asm`;
  }

  setFileName(fileName: string): void {
    // TODO: CodeWriterモジュールに新しいVMファイルの変換が開始したことを知らせる
    // ↑どういう意味？？？
    this.fileName = fileName;
  }

  writeArithmetic(command: string): void {
    let asm;
    switch (command) {
      case "add":
        asm = `${CodeWriter.POP_TOP}@SP\nAM=M-1\nM=M+D\n@SP\nM=M+1\n`;
        break;
      case "sub":
        asm = `${CodeWriter.POP_TOP}@SP\nAM=M-1\nM=M-D\n@SP\nM=M+1\n`;
        break;
      case "neg":
        asm = "@SP\nAM=M-1\nM=-M\n@SP\nM=M+1\n";
        break;
      case "eq": {
        const count = this.labelCount++;
        asm =
          `${CodeWriter.POP_TOP}@SP\nAM=M-1\nD=M-D\n` +
          `@TRUE_${count}\nD;JEQ\n@SP\nA=M\nM=0\n@END_${count}\n0;JMP\n` +
          `(TRUE_${count})\n@SP\nA=M\nM=-1\n(END_${count})\n@SP\nM=M+1\n`;
        break;
      }
      case "gt": {
        const count = this.labelCount++;
        asm =
          `${CodeWriter.POP_TOP}@SP\nAM=M-1\nD=M-D\n` +
          `@TRUE_${count}\nD;JGT\n@SP\nA=M\nM=0\n@END_${count}\n0;JMP\n` +
          `(TRUE_${count})\n@SP\nA=M\nM=-1\n(END_${count})\n@SP\nM=M+1\n`;
        break;
      }
      case "lt": {
        const count = this.labelCount++;
        asm =
          `${CodeWriter.POP_TOP}@SP\nAM=M-1\nD=M-D\n` +
          `@TRUE_${count}\nD;JLT\n@SP\nA=M\nM=0\n@END_${count}\n0;JMP\n` +
          `(TRUE_${count})\n@SP\nA=M\nM=-1\n(END_${count})\n@SP\nM=M+1\n`;
        break;
      }
      case "and":
        asm = `${CodeWriter.POP_TOP}@SP\nAM=M-1\nM=M&D\n@SP\nM=M+1\n`;
        break;
      case "or":
        asm = `${CodeWriter.POP_TOP}@SP\nAM=M-1\nM=M|D\n@SP\nM=M+1\n`;
        break;
      case "not":
        asm = `@SP\nAM=M-1\nM=!M\n@SP\nM=M+1\n`;
        break;
      default:
        throw new Error(`Invalid command: ${command}`);
    }
    this.result = `${this.result}${asm}`;
  }

  writePushPop(command: string, segment: string, index: number): void {
    // TODO: C_PUSHまたはC_POPコマンドをアセンブリコードに変換し、それを書き込む
    let asm;
    switch (command) {
      case "push":
        asm = convertPush(segment, index);
        break;
      case "pop":
        asm = "";
        break;
      default:
        throw new Error(`Invalid command: ${command}`);
    }
    this.result = `${this.result}${asm}`;
  }

  close(): void {
    // 最後に無限ループを入れてHackプログラムを終了させる
    this.result = `${this.result}(END)\n@END\n0;JMP\n`;

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
      return `@${index}\nD=A\n@SP\nA=M\nM=D\n@SP\nM=M+1\n`;
    default:
      throw new Error("Invalid push segment.");
  }
}
