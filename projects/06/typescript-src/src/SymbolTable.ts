export class SymbolTable {
  constructor() {
    // TODO: 空のシンボルテーブルを作成する
  }

  addEntry(symbol: string, address: number): void {
    // TODO: テーブルに (symbol,adress) のペアを追加する
  }

  contains(symbol: string): boolean {
    // TODO: シンボルテーブルは与えられた symbol を含むか?
    return false;
  }

  getAddress(symbol: string): number {
    // TODO: symbol に結びつけられたアドレスを 返す
    return 0;
  }
}