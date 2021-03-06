export type CommandType =
  | {
      name: "C_ARITHMETIC";
      command:
        | "add"
        | "sub"
        | "neg"
        | "eq"
        | "gt"
        | "lt"
        | "and"
        | "or"
        | "not";
    }
  | {
      name: "C_PUSH";
      command: "push";
    }
  | {
      name: "C_POP";
      command: "pop";
    }
  | {
      name: "C_LABEL";
      command: "label";
    }
  | {
      name: "C_GOTO";
      command: "goto";
    }
  | {
      name: "C_IF";
      command: "if-goto"
    }
  | {
      name: "C_FUNCTION";
      command: "function";
    }
  | {
      name: "C_RETURN";
      command: "return";
    }
  | {
      name: "C_CALL";
      command: "call";
    };
