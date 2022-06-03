const SPACE = " ";
const ONE_LEVEL = 2;

export class Indentation {
  level = 0;

  spaces(): string {
    return SPACE.repeat(this.level * ONE_LEVEL);
  }

  indent(): void {
    this.level++;
  }

  outdent(): void {
    this.level--;
  }
}
