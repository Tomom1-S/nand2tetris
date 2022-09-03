export type SymbolElement = {
  name: string;
  type: string;
  kind: SymbolKind;
  index: number;
};

export type TokenType =
  | "keyword"
  | "symbol"
  | "identifier"
  | "integerConstant"
  | "stringConstant";

export const keyWords = [
  "class",
  "constructor",
  "function",
  "method",
  "field",
  "static",
  "var",
  "int",
  "char",
  "boolean",
  "void",
  "true",
  "false",
  "null",
  "this",
  "let",
  "do",
  "if",
  "else",
  "while",
  "return",
];

export const symbols = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ".",
  ",",
  ";",
  "+",
  "-",
  "*",
  "/",
  "&",
  "|",
  "<",
  ">",
  "=",
  "~",
];

export const operators = ["+", "-", "*", "/", "&", "|", "<", ">", "="];

export const unaryOperators = ["-", "~"];

export type SymbolCategory =
  | "var"
  | "argument"
  | "static"
  | "field"
  | "class"
  | "subroutine";

export type SymbolKind = "static" | "field" | "argument" | "var";

export type Segment =
  | "constant"
  | "argument"
  | "local"
  | "static"
  | "this"
  | "that"
  | "pointer"
  | "temp";

export type Command =
  | "add"
  | "sub"
  | "neg"
  | "eq"
  | "gt"
  | "lt"
  | "and"
  | "or"
  | "not";

export type Term = {
  integerConstant: number[];
  symbol: string[];
  expression: Expression[];
};

export type Expression = {
  term: Term[];
};
