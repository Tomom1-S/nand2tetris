import { SymbolKind } from "./type";

type element = {
  name: string;
  type: string;
  kind: SymbolKind;
  index: number;
};

export class SymbolTable {
  table: { subroutine: Array<element>; klass: Array<element> };

  constructor() {
    this.table = {
      subroutine: [] as Array<element>,
      klass: [] as Array<element>,
    };
  }

  /**
   * 新しいサブルーチンのスコープを開始する
   * つまり、サブルーチンのシンボルテーブルをリセットする
   */
  startSubroutine(): void {
    this.table.subroutine = [];
  }

  /**
   * 引数の名前、型、属性で指定された新しい識別子を定義し、それに実行インデックスを割り当てる
   * STATIC と FIELD 属性の識別子はクラスのスコープを持ち、ARG と VAR 属性の識別子はサブルーチンのスコープを持つ
   * @param name 識別子の名前
   * @param type 識別子の型
   * @param kind 識別子の属性
   */
  define(name: string, type: string, kind: SymbolKind): void {
    if (this.kindOf(name) !== "none") {
      throw new Error(`${name} is already defined!`);
    }

    const index = this.varCount(kind);
    switch (kind) {
      case "static":
      case "field":
        console.log(name);
        this.table.klass.push({ name, type, kind, index });
        break;
      case "argument":
      case "var":
        console.log(name);
        this.table.subroutine.push({ name, type, kind, index });
        break;
      default:
        console.log(kind);
    }
  }

  /**
   * 引数で与えられた属性について、それが現在のスコープで定義されている数を返す
   * @param kind 識別子の属性
   * @returns スコープ内で定義されている数
   */
  varCount(kind: SymbolKind): number {
    let count = 0;

    const elements = [...this.table.subroutine, ...this.table.klass].filter(
      (e) => e
    );
    for (const e of elements) {
      if (e.kind === kind) {
        count++;
      }
    }
    return count;
  }

  /**
   * 引数で与えられた名前の識別子を現在のスコープで探し、その属性を返す
   * @param name 識別子の名前
   * @returns 識別子の属性、現在のスコープで見つからなければ NONE を返す
   */
  kindOf(name: string): SymbolKind | "none" {
    const kind = [...this.table.subroutine, ...this.table.klass]
      .filter((e) => e)
      .find((elem) => elem.name === name)?.kind;
    if (typeof kind !== "undefined") {
      return kind;
    }
    return "none";
  }

  /**
   * 引数で与えられた名前の識別子を 現在のスコープで探し、その型を返す
   * @param name 識別子の名前
   * @returns 識別子の型
   */
  typeOf(name: string): string {
    const type = [...this.table.subroutine, ...this.table.klass]
      .filter((e) => e)
      .find((elem) => elem.name === name)?.type;
    if (typeof type !== "undefined") {
      return type;
    }
    throw new Error(`${name} is not found!`);
  }

  /**
   * 引数で与えられた名前の識別子を現在のスコープで探し、そのインデックスを返す
   * @param name 識別子の名前
   * @returns 識別子のインデックス
   */
  indexOf(name: string): number {
    const index = [...this.table.subroutine, ...this.table.klass]
      .filter((e) => e)
      .find((elem) => elem.name === name)?.index;
    if (typeof index !== "undefined") {
      return index;
    }
    throw new Error(`${name} is not found!`);
  }
}
