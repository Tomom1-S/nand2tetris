export class CompilationEngine {
  constructor(inputPath: string, outputPath: string) {
    // TODO 与えられた入力と出力に対して 新しいコンパイルエンジンを生成する。
    // 次に呼ぶルーチンはcompileClass()でなければならない
  }

  compileClass(): void {
    // TODO クラスをコンパイルする
  }

  compileClassVarDec(): void {
    // TODO スタティック宣言またはフィールド宣言をコンパイルする
  }

  compileSubroutine(): void {
    // TODO メソッド、ファンクション、コンストラクタをコンパイルする
  }

  compileParameterList(): void {
    // TODO パラメータのリスト(空の可能性もある)をコンパイルする。カッコ“()”は含まない
  }

  compileVarDec(): void {
    // TODO var宣言をコンパイルする
  }

  compileStatements(): void {
    // TODO 一連の文をコンパイルする。波カッコ“{}”は含まない
  }

  compileDo(): void {
    // TODO do 文をコンパイルする
  }

  compileLet(): void {
    // TODO let 文をコンパイルする
  }

  compileWhile(): void {
    // TODO while 文をコンパイルする
  }

  compileReturn(): void {
    // TODO return 文をコンパイルする
  }

  compileIf(): void {
    // TODO if 文をコンパイルする。else 文を伴う可能性がある
  }

  compileExpression(): void {
    // TODO 式をコンパイルする
  }
}
