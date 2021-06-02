// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed.
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// initialization
  @8192  // screen size = 32 words * 256 rows
  D=A
  @screen_end
  M=D
  @status  // screen status (0: white, 1: black)
  M=0
  @i
  M=0

(LOOP)
  @KBD  // 24576: if no keyboard input exists, whiten screen
  D=M
  @WHITEN
  D;JEQ
  @BLACKEN
  0;JEQ

(BLACKEN)
  @i
  M=0
  @status  // if status is 1 (=black), do nothing
  D=M
  @LOOP
  D;JGT
  @BLACKEN_LOOP
  0;JMP

(BLACKEN_LOOP)
  @i  // if i >= screen_end, goto BLACKEN_END
  D=M
  @screen_end
  D=D-M
  @BLACKEN_END
  D;JGE
  @i  // change each bit of word on RAM[16384+i] to 1
  D=M
  @SCREEN
  A=A+D
  M=-1  // 11...11: to set all bits to 1
  @i  // i+1
  M=M+1
  @BLACKEN_LOOP
  0;JMP

(BLACKEN_END)
  @status
  M=1
  @LOOP
  0;JMP

(WHITEN)
  @i
  M=0
  @status  // if status is 0 (=white), do nothing
  D=M
  @LOOP
  D;JEQ
  @WHITEN_LOOP
  0;JMP

(WHITEN_LOOP)
  @i  // if i >= screen_end, goto WHITEN_END
  D=M
  @screen_end
  D=D-M
  @WHITEN_END
  D;JGE
  @i  // change each bit of word on RAM[16384+i] to 0
  D=M
  @SCREEN
  A=A+D
  M=0
  @i  // i+1
  M=M+1
  @WHITEN_LOOP
  0;JMP

(WHITEN_END)
  @status
  M=0
  @LOOP
  0;JMP

  @END
  0;JMP
