import * as fs from "fs";

const SEPARATOR = "\n";
export class CompilationEngine {
  inputPath: string;
  outputPath: string;
  results: string[] = [];

  constructor(inputPath: string, outputPath: string) {
    // TODO 与えられた入力と出力に対して 新しいコンパイルエンジンを生成する。
    // 次に呼ぶルーチンはcompileClass()でなければならない
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    this.results.push("<tokens>");
  }

  close() {
    this.results.push("</tokens>");
    fs.writeFile(this.outputPath, this.results.join(SEPARATOR), (err) => {
      if (err) {
        throw err;
      }
    });
    console.log(`SUCCESS: ${this.inputPath} -> ${this.outputPath}`);
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

  compileTerm(): void {
    // TODO termをコンパイルする。
    // このルーチンは、やや複雑であり、構文解析のルールには複数の選択肢が存在し、現トークンだけからは決定できない場合がある。
    // 具体的に言うと、もし現トークンが識別子であれば、このルーチンは、それが変数、配列宣言、サブルーチン呼び出しのいずれかを識別しなければならない。
    // そのためには、ひとつ先のトークンを読み込み、そのトークンが“[”か“(”か“.”のどれに該当するかを調べれば、現トークンの種類を決定することができる。
    // 他のトークンの場合は現トークンに含まないので、先読みを行う必要はない
  }
  compileExpressionList(): void {
    // TODO コンマで分離された式のリスト(空の可能性もある)をコンパイルする
  }
}
