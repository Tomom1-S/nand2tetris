const SPACE = " ";
const ONE_LEVEL = 2;

export class Indentation {
  level = 0;

  spaces(): string {
    return SPACE.repeat(this.level * ONE_LEVEL);
  }

  async indent(): Promise<void> {
    this.level++;
  }

  async outdent(): Promise<void> {
    this.level--;
  }
}
