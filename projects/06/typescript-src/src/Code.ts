export class Code {
  /**
   * dest ニーモニックのバイナリコードを返す
   * @param mnemonic
   * @returns [store A register, store D register, store M register]
   */
  dest(mnemonic: string): boolean[] {
    return [false, false, false];
  }

  /**
   *
   * @param mnemonic
   * @returns
   */
  comp(mnemonic: string): boolean[] {
    // TODO: comp ニーモニックのバイナリコードを返す
    return [false, false, false, false, false, false, false];
  }

  jump(mnemonic: string): boolean[] {
    // TODO: jump ニーモニックのバイナリコードを返す
    return [false, false, false];
  }
}