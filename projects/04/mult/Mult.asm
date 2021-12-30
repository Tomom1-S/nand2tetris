// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
//
// This program only needs to handle arguments that satisfy
// R0 >= 0, R1 >= 0, and R0*R1 < 32768.

// initialization
  @2 // result=0
  M=0

  @0  // R0
  D=M
  @END  // if R0=0, do nothing (R2=0)
  D;JEQ

  @1  // R1
  D=M
  @END  // if R1=0, do nothing (R2=0)
  D;JEQ

  @i // i=0
  M=0

(LOOP)
  @i  // if (i-R0) >= 0 goto END
  D=M
  @0
  D=D-M
  @END
  D;JGE
  @1  // result+=R1
  D=M
  @2
  M=D+M
  @i  // i+1
  M=M+1
  @LOOP  // goto LOOP
  0;JMP

(END)
  @END
  0;JMP
