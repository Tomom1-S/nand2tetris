import * as fs from 'fs';
import { Code } from './Code';
import { CommandType } from './CommandType';
import { Parser } from "./Parser";

const filepath = process.argv.slice(2)[0];
const parser = new Parser(filepath);
const code = new Code();

let result = "";

while (parser.hasMoreCommands()) {
  parser.advance();

  const commandType: CommandType = parser.commandType();
  console.log(commandType);
  if (commandType !== CommandType.c) {
    const symbol = parser.symbol();
    console.log(symbol);
    if (!Number.isNaN(Number(symbol))) {
      const num = Number(symbol).toString(2);
      result = result.concat(num.padStart(16, "0"), "\n");
    }
    // TODO: ラベルのときの変換
    continue;
  }

  const dest = convertBitString(code.dest(parser.dest()));
  const comp = convertBitString(code.comp(parser.comp()));
  const jump = convertBitString(code.jump(parser.jump()));
  // console.log(`${dest}${comp}${jump}`);
  result = result.concat(dest, comp, jump, "\n");
}

// TODO: filepathの名前に合わせて、保存するときの名前を変える
fs.writeFile("hogehoge.hack", result, (err) => {
  if (err) {
    console.log(err);
  }
})

function convertBitString(bits: boolean[]): string {
  const array = new Array<number>(bits.length);
  bits.forEach((bit, index) => {
    array[index] = bit ? 1 : 0;
  })
  return array.join("");
}
