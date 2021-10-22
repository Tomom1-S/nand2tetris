export class CommandType {
  constructor(public value: string) {}

  toString() {
    return this.value;
  }

  // values
  static arithmetic = new CommandType("C_ARITHMETIC");
  static push = new CommandType("C_PUSH");
  static pop = new CommandType("C_POP");
  static label = new CommandType("C_LABEL");
  static goto = new CommandType("C_GOTO");
  static if = new CommandType("C_IF");
  static function = new CommandType("C_FUNCTION");
  static return = new CommandType("C_RETURN");
  static call = new CommandType("C_CALL");
}
