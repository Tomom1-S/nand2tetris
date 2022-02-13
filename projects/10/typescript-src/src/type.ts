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

export type KeyWord =
  | { name: "CLASS"; tag: "class" }
  | { name: "METHOD" }
  | { name: "FUNCTION"; tag: "function" }
  | { name: "CONSTRUCTOR"; tag: "constructor" }
  | { name: "INT" }
  | { name: "BOOLEAN" }
  | { name: "CHAR" }
  | { name: "VOID" }
  | { name: "VAR"; tag: "varDec" }
  | { name: "STATIC" }
  | { name: "FIELD" }
  | { name: "LET"; tag: "letStatement" }
  | { name: "DO"; tag: "doStatemtent" }
  | { name: "IF"; tag: "ifStatement" }
  | { name: "FALSE" }
  | { name: "WHILE"; tag: "whileStatement" }
  | { name: "RETURN"; tag: "returnStatement" }
  | { name: "TRUE" }
  | { name: "FALSE" }
  | { name: "NULL" }
  | { name: "THIS" };
