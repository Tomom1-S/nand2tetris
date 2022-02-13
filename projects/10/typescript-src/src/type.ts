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

export type TokenType =
  | { name: "KEYWORD"; tag: "keyword" }
  | { name: "SYMBOL"; tag: "symbol" }
  | { name: "IDENTIFIER"; tag: "identifier" }
  | { name: "INT_CONST"; tag: "integerConstant" }
  | { name: "STRING_CONST"; tag: "stringConstant" };
