import * as fs from "fs";
import { Command, Segment } from "./type";

const SEPARATOR = "\n";

export class VMWriter {
  outputPath: string;
  results: string[] = [];

  constructor(filepath: string) {
    this.outputPath = filepath;
  }

  writePush(segment: Segment, index: number): void {
    this.results.push(`push ${segment} ${index}`);
  }

  writePop(segment: Segment, index: number): void {
    this.results.push(`pop ${segment} ${index}`);
  }

  writeArithmetic(command: Command): void {
    this.results.push(command);
  }

  writeLabel(label: string): void {
    this.results.push(`label ${label}`);
  }

  writeGoto(label: string): void {
    this.results.push(`goto ${label}`);
  }

  writeIf(label: string): void {
    this.results.push(`if-goto ${label}`);
  }

  writeCall(name: string, nArgs: number): void {
    this.results.push(`call ${name} ${nArgs}`);
  }

  writeFunction(name: string, nLocals: number): void {
    this.results.push(`function ${name} ${nLocals}`);
  }

  writeReturn(): void {
    this.results.push("return");
  }

  close(): void {
    this.results.push(""); // ファイルの最後に空行を挿入
    fs.writeFileSync(this.outputPath, this.results.join(SEPARATOR));
    console.log(`Compiled: ${this.outputPath}`);
  }
}
