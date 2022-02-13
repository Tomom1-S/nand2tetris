import { KeyWord, TokenType } from "./type";

export class JackTokenizer {
  constructor(path: string) {
    // TODO 入力ファイル/ストリームを開き、トークン化を行う準備をする
  }

  hasMoreTokens(): boolean {
    // TODO 入力にまだトークンは存在するか?
    return false;
  }

  advance(): void {
    // TODO 入力から次のトークンを取得し、それを現在のトークン(現トークン)とする。
    // このルーチンは、hasMoreTokens()がtrueの場合のみ呼び出すことができる。
    // また、最初は現トークンは設定されていない
  }

  tokenType(): TokenType {
    // TODO 現トークンの種類を返す
    return { name: "KEYWORD" };
  }

  keyWord(): KeyWord {
    // TODO 現トークンのキーワードを返す。
    // このルーチンは、tokenType()がKEYWORDの場合のみ呼び出すことができる
    return { name: "CLASS" };
  }

  symbol(): string {
    // TODO 現トークンの文字を返す。
    // このルーチンは、tokenType()がSYMBOLの場合のみ呼び出すことができる
    return "";
  }

  identifier(): string {
    // TODO 現トークンの識別子(identifier)を返す。
    // このルーチンは、tokenType()がIDENTIFIERの場合のみ呼び出すことができる
    return "";
  }

  intVal(): number {
    // TODO 現トークンの整数の値を返す。
    // このルーチンは、tokenType()がINT_CONSTの場合のみ呼び出すことができる
    return 0;
  }

  stringVal(): string {
    // TODO 現トークンの文字列を返す。
    // このルーチンは、tokenType()がSTRING_CONSTの場合のみ呼び出すことができる
    return "";
  }
}
