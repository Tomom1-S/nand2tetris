export class SymbolTable {
  table: Map<string, number>;
  memoryAddress = 16;

  constructor() {
    this.table = new Map([
      ["SP", 0],
      ["LCL", 1],
      ["ARG", 2],
      ["THIS", 3],
      ["THAT", 4],
      ["R0", 0],
      ["R1", 1],
      ["R2", 2],
      ["R3", 3],
      ["R4", 4],
      ["R5", 5],
      ["R6", 6],
      ["R7", 7],
      ["R8", 8],
      ["R9", 9],
      ["R10", 10],
      ["R11", 11],
      ["R12", 12],
      ["R13", 13],
      ["R14", 14],
      ["R15", 15],
      ["SCREEN", 16384],
      ["KBD", 24576]
    ])
  }

  addEntry(symbol: string, address: number): void {
    if (this.contains(symbol) ) {
      return;
    }
    this.table.set(symbol, address);
  }

  contains(symbol: string): boolean {
    return this.table.has(symbol);
  }

  getAddress(symbol: string): number {
    let address = this.table.get(symbol);
    if (address !== undefined) {
      return address;
    }
    this.table.set(symbol, this.memoryAddress++);
    address = this.table.get(symbol);
    if (address !== undefined) {
      return address;
    }
    throw new Error(`${symbol} not fount in symbol table`);
  }
}
