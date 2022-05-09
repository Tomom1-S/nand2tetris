import { Kind } from "./type";

interface Element {
  type: string;
  kind: Kind;
  index: number;
}

export class SymbolTable {
  // 0番目: サブルーチンのシンボルテーブル
  // 1番目: クラスのシンボルテーブル
  table: Array<IHashtable<string, Element>>;

  constructor() {
    this.table = [];
  }

  /**
   * 新しいサブルーチンのスコープを開始する
   * つまり、サブルーチンのシンボルテーブルをリセットする
   */
  startSubroutine(): void {
    this.table[0].clear();
  }

  /**
   * 引数の名前、型、属性で指定された新しい識別子を定義し、それに実行インデックスを割り当てる
   * STATIC と FIELD 属性の識別子はクラスのスコープを持ち、ARG と VAR 属性の識別子はサブルーチンのスコープを持つ
   * @param name 識別子の名前
   * @param type 識別子の型
   * @param kind 識別子の属性
   */
  define(name: string, type: string, kind: Kind): void {
    if (this.kindOf(name) !== "NONE") {
      throw new Error(`${name} is already defined!`);
    }

    const index = this.indexOf(name);
    switch (kind) {
      case "STATIC":
      case "FIELD":
        this.table[1].put(name, { type, kind, index });
        break;
      case "ARG":
      case "VAR":
        this.table[0].put(name, { type, kind, index });
        break;
    }
  }

  /**
   * 引数で与えられた属性について、それが現在のスコープで定義されている数を返す
   * @param kind 識別子の属性
   * @returns スコープ内で定義されている数
   */
  varCount(kind: Kind): number {
    let count = 0;
    for (const t of this.table) {
      for (const v of t.values()) {
        if (v.kind === kind) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * 引数で与えられた名前の識別子を現在のスコープで探し、その属性を返す
   * @param name 識別子の名前
   * @returns 識別子の属性、現在のスコープで見つからなければ NONE を返す
   */
  kindOf(name: string): Kind | "NONE" {
    for (const t of this.table) {
      if (t.containsKey(name)) {
        return t.get(name).kind;
      }
    }
    return "NONE";
  }

  /**
   * 引数で与えられた名前の識別子を 現在のスコープで探し、その型を返す
   * @param name 識別子の名前
   * @returns 識別子の型
   */
  typeOf(name: string): string {
    for (const t of this.table) {
      if (t.containsKey(name)) {
        return t.get(name).type;
      }
    }
    throw new Error(`${name} is not found!`);
  }

  /**
   * 引数で与えられた名前の識別子を現在のスコープで探し、そのインデックスを返す
   * @param name 識別子の名前
   * @returns 識別子のインデックス
   */
  indexOf(name: string): number {
    for (const t of this.table) {
      if (t.containsKey(name)) {
        return t.get(name).index;
      }
    }
    throw new Error(`${name} is not found!`);
  }
}
