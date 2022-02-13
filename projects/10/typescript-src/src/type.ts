export type TokenType =
  | { name: "KEYWORD" }
  | { name: "SYMBOL" }
  | { name: "IDENTIFIER" }
  | { name: "INT_CONST" }
  | { name: "STRING_CONST" };

export type KeyWord =
  | { name: "CLASS" }
  | { name: "METHOD" }
  | { name: "FUNCTION" }
  | { name: "CONSTRUCTOR" }
  | { name: "INT" }
  | { name: "BOOLEAN" }
  | { name: "CHAR" }
  | { name: "VOID" }
  | { name: "VAR" }
  | { name: "STATIC" }
  | { name: "FIELD" }
  | { name: "LET" }
  | { name: "DO" }
  | { name: "IF" }
  | { name: "FELSE" }
  | { name: "WHILE" }
  | { name: "RETURN" }
  | { name: "TRUE" }
  | { name: "FALSE" }
  | { name: "NULL" }
  | { name: "THIS" };
