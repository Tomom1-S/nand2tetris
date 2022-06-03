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

export type SymbolKind = "STATIC" | "FIELD" | "ARG" | "VAR";

export type Segment =
  | "CONST"
  | "ARG"
  | "LOCAL"
  | "STATIC"
  | "THIS"
  | "THAT"
  | "POINTER"
  | "TEMP";

export type Command =
  | "ADD"
  | "SUB"
  | "NEG"
  | "EQ"
  | "GT"
  | "LT"
  | "AND"
  | "OR"
  | "NOT";
