import * as fs from "fs";
import * as path from "path";

const SEPARATOR = "\n";
const POINTER_BASE = 3;
const TEMP_BASE = 5;
const STACK_BASE = 256;
const POP_STACK = ["@SP", "AM=M-1", "D=M"];
const PUSH_STACK = ["@SP", "A=M", "M=D", "@SP", "M=M+1"];

export class CodeWriter {
  fileName: string;
  saveName: string;
  labelCount = 0;
  returnCount = 0;
  argNum = 0;
  functionName = "";
  results: string[] = [];

  constructor(filepath: string) {
    const parsedPath = path.parse(filepath);
    const saveDir = fs.lstatSync(filepath).isFile() ? parsedPath.dir : `${parsedPath.dir}/${parsedPath.name}`;
    this.saveName = `${saveDir}/${parsedPath.name}.asm`;
  }

  setFileName(fileName: string): void {
    this.fileName = path.parse(fileName).name;
    this.functionName = "";
  }

  writeInit(): void {
    // スタックポインタの初期化
    this.results.push(`@${STACK_BASE}`);
    this.results.push("D=A");
    this.results.push("@SP");
    this.results.push("M=D");

    // Sys.init実行
    const returnLabel = createLabelWithFunctionName("RETURN", "Sys.init")
    // リターンアドレスを保存
    this.results.push(`@${returnLabel}`);
    this.results.push("D=A");
    this.results.push(...PUSH_STACK);
    // 関数の呼び出し側の状態を保存
    this.results.push(...storeCondition("LCL"));
    this.results.push(...storeCondition("ARG"));
    this.results.push(...storeCondition("THIS"));
    this.results.push(...storeCondition("THAT"));
    // 制御を移す
    this.writeGoto("Sys.init");
    // リターンアドレスのためのラベルを宣言する
    this.results.push(`(${returnLabel})`);

  }

  writeArithmetic(command: string): void {
    switch (command) {
      case "add":
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("M=M+D");
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      case "sub":
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("M=M-D");
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      case "neg":
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("M=-M");
        this.results.push("@SP");
        this.results.push("M=M+1");
        break;
      case "eq": {
        const count = this.labelCount++;
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("D=M-D");
        this.results.push(`@TRUE_${count}`);
        this.results.push("D;JEQ");
        this.results.push("@SP");
        this.results.push("A=M");
        this.results.push("M=0");
        this.results.push(`@END_${count}`);
        this.results.push("0;JMP");
        this.results.push(`(TRUE_${count})`);
        this.results.push("@SP");
        this.results.push("A=M");
        this.results.push("M=-1");
        this.results.push(`(END_${count})`);
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      }
      case "gt": {
        const count = this.labelCount++;
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("D=M-D");
        this.results.push(`@TRUE_${count}`);
        this.results.push("D;JGT");
        this.results.push("@SP");
        this.results.push("A=M");
        this.results.push("M=0");
        this.results.push(`@END_${count}`);
        this.results.push("0;JMP");
        this.results.push(`(TRUE_${count})`);
        this.results.push("@SP");
        this.results.push("A=M");
        this.results.push("M=-1");
        this.results.push(`(END_${count})`);
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      }
      case "lt": {
        const count = this.labelCount++;
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("D=M-D");
        this.results.push(`@TRUE_${count}`);
        this.results.push("D;JLT");
        this.results.push("@SP");
        this.results.push("A=M");
        this.results.push("M=0");
        this.results.push(`@END_${count}`);
        this.results.push("0;JMP");
        this.results.push(`(TRUE_${count})`);
        this.results.push("@SP");
        this.results.push("A=M");
        this.results.push("M=-1");
        this.results.push(`(END_${count})`);
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      }
      case "and":
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("M=M&D");
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      case "or":
        this.results.push(...POP_STACK);
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("M=M|D");
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      case "not":
        this.results.push("@SP");
        this.results.push("AM=M-1");
        this.results.push("M=!M");
        this.results.push("@SP");
        this.results.push("M=M+1");
        return;
      default:
        throw new Error(`Invalid command: ${command}`);
    }
  }

  writePushPop(command: string, segment: string, index: number): void {
    let asm;
    switch (command) {
      case "push":
        asm = convertPush(segment, index, this.fileName);
        break;
      case "pop":
        asm = convertPop(segment, index, this.fileName);
        break;
      default:
        throw new Error(`Invalid command: ${command}`);
    }
    this.results.push(...asm);
  }

  writeLabel(label: string): void {
    this.results.push(`(${createLabelWithFunctionName(label, this.functionName)})`);
  }

  writeGoto(label: string): void {
    this.results.push(`@${createLabelWithFunctionName(label, this.functionName)}`);
    this.results.push("0;JMP");
  }

  writeIf(label: string): void {
    this.results.push(...POP_STACK);
    this.results.push(`@${createLabelWithFunctionName(label, this.functionName)}`);
    this.results.push("D;JNE");
  }

  writeCall(functionName: string, numArgs: number): void {
    const returnLabel = createLabelWithFunctionName(`RETURN_${this.returnCount++}`, functionName)
    // リターンアドレスを保存
    this.results.push(`@${returnLabel}`);
    this.results.push("D=A");
    this.results.push(...PUSH_STACK);
    // 関数の呼び出し側の状態を保存
    this.results.push(...storeCondition("LCL"));
    this.results.push(...storeCondition("ARG"));
    this.results.push(...storeCondition("THIS"));
    this.results.push(...storeCondition("THAT"));
    // ARG=call前に引数を入れた場所 に移す(ARG=SP-5-numArgs)
    this.results.push("@5");
    this.results.push("D=A");
    this.results.push(`@${numArgs}`);
    this.results.push("D=D+A");
    this.results.push("@SP");
    this.results.push("D=M-D");
    this.results.push("@ARG");
    this.results.push("M=D");
    // LCL=今のSP に移す
    this.results.push("@SP");
    this.results.push("D=M");
    this.results.push("@LCL");
    this.results.push("M=D");
    // 制御を移す
    this.writeGoto(functionName);
    // リターンアドレスのためのラベルを宣言する
    this.results.push(`(${returnLabel})`);
  }

  writeReturn(): void {
    // FRAMEを一時保存
    this.results.push("@LCL");
    this.results.push("D=M");
    this.results.push("@frame");
    this.results.push("M=D");
    // リターンアドレスを取得
    this.results.push("@5");
    this.results.push("D=A");
    this.results.push("@frame");
    this.results.push("A=M-D");
    this.results.push("D=M")
    this.results.push("@ret");
    this.results.push("M=D");
    // 関数の戻り値を保存
    this.results.push(...POP_STACK);
    this.results.push("@ARG");
    this.results.push("A=M");
    this.results.push("M=D");
    // SPを戻す
    this.results.push("@ARG");
    this.results.push("D=M+1");
    this.results.push("@SP");
    this.results.push("M=D");
    // ポインタを戻す
    this.results.push(...resetPointer("THAT", 1));
    this.results.push(...resetPointer("THIS", 2));
    this.results.push(...resetPointer("ARG", 3));
    this.results.push(...resetPointer("LCL", 4));
    // リターンアドレスに移動
    this.results.push("@ret");
    this.results.push("A=M");
    this.results.push("0;JMP");
  }

  writeFunction(functionName: string, numLocals: number): void {
    this.functionName = functionName;
    this.argNum = numLocals;

    this.results.push(`(${functionName})`);
    for (let i = 0; i < numLocals; i++) {
      this.results.push("@0");
      this.results.push("D=A");
      this.results.push(...PUSH_STACK);
    }
  }

  close(): void {
    // 最後に無限ループを入れてHackプログラムを終了させる
    this.results.push("(END)");
    this.results.push("@END");
    this.results.push("0;JMP");

    fs.writeFile(this.saveName, this.results.join(SEPARATOR), (err) => {
      if (err) {
        throw err;
      }
    });
  }
}

function convertPush(
  segment: string,
  index: number,
  fileName: string
): string[] {
  if (segment === "constant") {
    const results = [];
    results.push(`@${index}`);
    results.push("D=A");
    results.push(...PUSH_STACK);
    return results;
  }

  const label = createLabel({ segment, index }, fileName);
  const formula = {
    forwardAddress: [] as string[],
    moveTargetAddress: [] as string[],
  };
  switch (segment) {
    case "pointer":
    case "temp":
    case "static":
      break;
    default:
      formula.forwardAddress.push(`@${index}`);
      formula.forwardAddress.push("D=A");

      formula.moveTargetAddress.push("A=M+D");
  }
  const results = [];
  results.push(...formula.forwardAddress);
  results.push(`@${label}`);
  results.push(...formula.moveTargetAddress);
  results.push("D=M");
  results.push(...PUSH_STACK);
  return results;
}

function convertPop(
  segment: string,
  index: number,
  fileName: string
): string[] {
  const label = createLabel({ segment, index }, fileName);
  const formula = {
    forwardAddress: [] as string[],
    moveTargetAddress: [] as string[],
    backAddress: [] as string[],
  };
  switch (segment) {
    case "pointer":
    case "temp":
    case "static":
      break;
    default:
      formula.forwardAddress.push(`@${index}`);
      formula.forwardAddress.push("D=A");
      formula.forwardAddress.push(`@${label}`);
      formula.forwardAddress.push("M=M+D");

      formula.moveTargetAddress.push("A=M");

      formula.backAddress.push(`@${index}`);
      formula.backAddress.push("D=A");
      formula.backAddress.push(`@${label}`);
      formula.backAddress.push("M=M-D");
  }
  const results = [];
  results.push(...formula.forwardAddress);
  results.push(...POP_STACK);
  results.push(`@${label}`);
  results.push(...formula.moveTargetAddress);
  results.push("M=D");
  results.push(...formula.backAddress);
  return results;
}

function createLabel(
  input: { segment: string; index: number },
  fileName: string
): string {
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
      return `R${POINTER_BASE + input.index}`;
    case "temp":
      return `R${TEMP_BASE + input.index}`;
    case "static":
      return `${fileName}.${input.index}`;
    default:
      throw new Error(`Invalid segment: ${input.segment}`);
  }
}

function createLabelWithFunctionName(label: string, functionName: string) {
  // ラベルが関数名のときはそのまま
  if (label.includes(".")) {
    return label;
  }
  return functionName === "" ? label : `${functionName}$${label}`;
}

function resetPointer(name: string, index: number): string[] {
  const results = [] as string[];
  results.push(`@${index}`);
  results.push("D=A");
  results.push("@frame");
  results.push("A=M-D");
  results.push("D=M")
  results.push(`@${name}`);
  results.push("M=D");
  return results;
}

function storeCondition(target: string): string[] {
  const results = [] as string[];
  results.push(`@${target}`);
  results.push("D=M");
  results.push(...PUSH_STACK);
  return results;
}
