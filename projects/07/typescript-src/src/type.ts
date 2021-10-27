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
    }
  | {
      name: "C_GOTO";
    }
  | {
      name: "C_IF";
    }
  | {
      name: "C_FUNCTION";
    }
  | {
      name: "C_RETURN";
    }
  | {
      name: "C_CALL";
    };
