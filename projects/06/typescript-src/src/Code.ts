export class Code {
  /**
   * destニーモニックのバイナリコードを返す
   * @param mnemonic
   * @returns [store A register, store D register, store M register]
   */
  dest(mnemonic: string): boolean[] {
    switch (mnemonic) {
      case "null":
        return [false, false, false];
      case "M":
        return [false, false, true];
      case "D":
        return [false, true, false];
      case "MD":
        return [false, true, true];
      case "A":
        return [true, false, false];
      case "AM":
        return [true, false, true];
      case "AD":
        return [true, true, false];
      case "AMD":
        return [true, true, true];
      default:
        throw new Error("dest: Invalid mnemonic");
    }
  }

  /**
   * compニーモニックのバイナリコードを返す
   * @param mnemonic
   * @returns [a, c1, c2, c3, c4, c5, c6]
   */
  comp(mnemonic: string): boolean[] {
    switch (mnemonic) {
      case "0":
        return [false, true, false, true, false, true, false];
      case "1":
        return [false, true, true, true, true, true, true];
      case "-1":
        return [false, true, true, true, false, true, false];
      case "D":
        return [false, false, false, true, true, false, false];
      case "A":
        return [false, true, true, false, false, false, false];
      case "!D":
        return [false, false, false, true, true, false, true];
      case "!A":
        return [false, true, true, false, false, false, true];
      case "-D":
        return [false, false, true, true, true, true, true];
      case "-A":
        return [false, true, true, false, false, true, true];
      case "D+1":
        return [false, false, true, true, true, true, true];
      case "A+1":
        return [false, true, true, false, true, true, true];
      case "D-1":
        return [false, false, false, true, true, true, false];
      case "A-1":
        return [false, true, true, false, false, true, false];
      case "D+A":
        return [false, false, false, false, false, true, false];
      case "D-A":
        return [false, false, true, false, false, true, true];
      case "A-D":
        return [false, false, false, false, true, true, true];
      case "D&A":
        return [false, false, false, false, false, false, false];
      case "D|A":
        return [false, false, true, false, true, false, true];
      case "M":
        return [true, true, true, false, false, false, false];
      case "!M":
        return [true, true, true, false, false, false, true];
      case "-M":
        return [true, true, true, false, false, true, true];
      case "M+1":
        return [true, true, true, false, true, true, true];
      case "M-1":
        return [true, true, true, false, false, true, false];
      case "D+M":
        return [true, false, false, false, false, true, false];
      case "D-M":
        return [true, false, true, false, false, true, true];
      case "M-D":
        return [true, false, false, false, true, true, true];
      case "D&M":
        return [true, false, false, false, false, false, false];
      case "D|M":
        return [true, false, true, false, true, false, true];
      default:
        throw new Error("comp: Invalid mnemonic");
    }
  }

  /**
   * jumpニーモニックのバイナリコードを返す
   * @param mnemonic
   * @returns [out < 0, out = 0, out > 0]
   */
  jump(mnemonic: string): boolean[] {
    switch (mnemonic) {
      case "null":
        return [false, false, false];
      case "JGT":
        return [false, false, true];
      case "JEQ":
        return [false, true, false];
      case "JGE":
        return [false, true, true];
      case "JLT":
        return [true, false, false];
      case "JNE":
        return [true, false, true];
      case "JLE":
        return [true, true, false];
      case "JMP":
        return [true, true, true];
      default:
        throw new Error("jump: Invalid mnemonic");
    }
  }
}