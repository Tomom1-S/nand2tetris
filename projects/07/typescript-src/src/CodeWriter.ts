import * as fs from "fs";

export class CodeWriter {
  fileName: string;
  saveName: string;
  labelCount = 0;
  result = "";

  static readonly POINTER_BASE = 3;
  static readonly TEMP_BASE = 5;
  static readonly POP_STACK = "@SP\nAM=M-1\nD=M\n";
  static readonly PUSH_STACK = "@SP\nA=M\nM=D\n@SP\nM=M+1\n";

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
        asm = `${CodeWriter.POP_STACK}@SP\nAM=M-1\nM=M+D\n@SP\nM=M+1\n`;
        break;
      case "sub":
        asm = `${CodeWriter.POP_STACK}@SP\nAM=M-1\nM=M-D\n@SP\nM=M+1\n`;
        break;
      case "neg":
        asm = "@SP\nAM=M-1\nM=-M\n@SP\nM=M+1\n";
        break;
      case "eq": {
        const count = this.labelCount++;
        asm =
          `${CodeWriter.POP_STACK}@SP\nAM=M-1\nD=M-D\n` +
          `@TRUE_${count}\nD;JEQ\n@SP\nA=M\nM=0\n@END_${count}\n0;JMP\n` +
          `(TRUE_${count})\n@SP\nA=M\nM=-1\n(END_${count})\n@SP\nM=M+1\n`;
        break;
      }
      case "gt": {
        const count = this.labelCount++;
        asm =
          `${CodeWriter.POP_STACK}@SP\nAM=M-1\nD=M-D\n` +
          `@TRUE_${count}\nD;JGT\n@SP\nA=M\nM=0\n@END_${count}\n0;JMP\n` +
          `(TRUE_${count})\n@SP\nA=M\nM=-1\n(END_${count})\n@SP\nM=M+1\n`;
        break;
      }
      case "lt": {
        const count = this.labelCount++;
        asm =
          `${CodeWriter.POP_STACK}@SP\nAM=M-1\nD=M-D\n` +
          `@TRUE_${count}\nD;JLT\n@SP\nA=M\nM=0\n@END_${count}\n0;JMP\n` +
          `(TRUE_${count})\n@SP\nA=M\nM=-1\n(END_${count})\n@SP\nM=M+1\n`;
        break;
      }
      case "and":
        asm = `${CodeWriter.POP_STACK}@SP\nAM=M-1\nM=M&D\n@SP\nM=M+1\n`;
        break;
      case "or":
        asm = `${CodeWriter.POP_STACK}@SP\nAM=M-1\nM=M|D\n@SP\nM=M+1\n`;
        break;
      case "not":
        asm = `@SP\nAM=M-1\nM=!M\n@SP\nM=M+1\n`;
        break;
      default:
        throw new Error(`Invalid command: ${command}`);
    }
    this.result = `${this.result}${asm}\n`;
  }

  writePushPop(command: string, segment: string, index: number): void {
    // TODO: C_PUSHまたはC_POPコマンドをアセンブリコードに変換し、それを書き込む
    // 4. 最後に、static セグメントに対応する。
    let asm;
    switch (command) {
      case "push":
        asm = convertPush(segment, index);
        break;
      case "pop":
        asm = convertPop(segment, index);
        break;
      default:
        throw new Error(`Invalid command: ${command}`);
    }
    this.result = `${this.result}${asm}\n`;
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
  if (segment === "constant") {
    return `@${index}\nD=A\n${CodeWriter.PUSH_STACK}`;
  }

  const label = createLabel({ segment, index });
  let formula;
  switch (segment) {
    case "pointer":
    case "temp":
      formula = "";
      break;
    default:
      formula = "A=M+D\n";
  }
  return `@${index}\nD=A\n@${label}\n${formula}D=M\n${CodeWriter.PUSH_STACK}`;
}

function convertPop(segment: string, index: number): string {
  const label = createLabel({ segment, index });
  let formula = { forwardAddress: "", moveTargetAddress: "", backAddress: "" };
  switch (segment) {
    case "pointer":
    case "temp":
      break;
    default:
      formula = {
        forwardAddress: `@${index}\nD=A\n@${label}\nM=M+D\n`,
        moveTargetAddress: "A=M\n",
        backAddress: `@${index}\nD=A\n@${label}\nM=M-D\n`,
      };
  }
  return `${formula.forwardAddress}${CodeWriter.POP_STACK}@${label}\n${formula.moveTargetAddress}M=D\n${formula.backAddress}`;
}

function createLabel(input: { segment: string; index: number }): string {
  switch (input.segment) {
    case "local":
      return "LCL";
    case "argument":
      return "ARG";
    case "this":
      return "THIS";
    case "that":
      return "THAT";
    case "pointer":
      return `R${CodeWriter.POINTER_BASE + input.index}`;
    case "temp":
      return `R${CodeWriter.TEMP_BASE + input.index}`;
    case "static":
      return "";
    default:
      throw new Error(`Invalid segment: ${input.segment}`);
  }
}
