const CommandType = {
  Accomand: "A_COMMAND",
  Ccommand: "C_COMMAND",
  Lcommand: "L_COMMEND",
} as const;
type CommandType = typeof CommandType[keyof typeof CommandType];
