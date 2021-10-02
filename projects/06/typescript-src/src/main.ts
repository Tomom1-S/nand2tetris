import * as fs from 'fs';
import { Code } from './Code';
import { Parser } from "./Parser";
import { SymbolTable } from './SymbolTable';

const filepath = process.argv.slice(2)[0];
const parser1 = new Parser(filepath);
const table = new SymbolTable();

let address = 0;
while (parser1.hasMoreCommands()) {
  parser1.advance();

  if (parser1.commandType().name !== "L_COMMAND") {
    address++;
    continue;
  }
  const symbol = parser1.symbol()
  if (!table.contains(symbol)) {
    table.addEntry(symbol, address);
  }
}

const parser2 = new Parser(filepath);
const code = new Code();
let result = "";
while (parser2.hasMoreCommands()) {
  parser2.advance();

  const commandType = parser2.commandType();
  switch (commandType.name) {
    case "L_COMMAND":
      break;
    case "A_COMMAND":
      const symbol = parser2.symbol();
      // When symbol is a label
      let symbolValue;
      if (Number.isNaN(Number(symbol))) {
        symbolValue = table.getAddress(symbol);
      } else {
        symbolValue = Number(symbol);
      }
      const num = symbolValue.toString(2);
      result = result.concat(`${num.padStart(16, "0")}\n`);
      break;
    default:  // C_COMMAND
      const dest = convertBitString(code.dest(parser2.dest()));
      const comp = convertBitString(code.comp(parser2.comp()));
      const jump = convertBitString(code.jump(parser2.jump()));
      result = result.concat(`111${comp}${dest}${jump}\n`);
  }
}

// TODO: filepathの名前に合わせて、保存するときの名前を変える
const savepath = filepath.slice(0, filepath.lastIndexOf("/"));
const filename = filepath.split("/").pop()?.split(".")[0];
fs.writeFile(`${savepath}/${filename}1.hack`, result, (err) => {
  if (err) {
    throw err;
  }
})

function convertBitString(bits: boolean[]): string {
  const array = new Array<number>(bits.length);
  bits.forEach((bit, index) => {
    array[index] = bit ? 1 : 0;
  })
  return array.join("");
}
