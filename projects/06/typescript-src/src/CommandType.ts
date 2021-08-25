export class CommandType {
    constructor(public value: string) {
    }

    toString() {
        return this.value;
    }

    // values
    static a = new CommandType("A_COMMAND");
    static c = new CommandType("C_COMMAND");
    static l = new CommandType("L_COMMAND");
}
