# Ch.4 Project

## 乗算プログラム(Mult.asm)

### イメージ

```java
class Mult {
    int operate(final int r0, final int r1) {
        int r2 = 0;  // result

        if (r0 == 0) {
            return r2;
        }
        if (r1 == 0) {
            return r2;
        }

        // LOOP
        while (i < r0) {
            result += r1;
            i++;
        }
        return r2;
    }
}
```

## 入出力操作プログラム(Fill.asm)

### イメージ

```java
class Fill {
    int[] ram = new int[24576];  // each element is int[16]
    final int screenIdx = 16384;
    final int kbdIdx = 24575;

    void operate() {
        final int screenEnd = 8192;
        int status = 0;  // screen status (0: white, 1: black)

        // LOOP
        while(true) {
            int kbd = ram[kbdIdx];
            if (kbd == 0) {
                whiten();
            }
            blacken();
        }
    }

    // BLACKEN
    void blacken() {
        int i = 0;
        if (status > 0) {  // status == 1
            return;
        }

        // BLACKEN_LOOP
        while (i - screenEnd < 0) {
            ram[screenIdx + i] = -1;
            // 実際のram[screenIdx + i]は16ビットなので、
            // すべてのビットを1にするためにram[screenIdx + i]には-1を入れる
            i++;
        }

        // BLACKEN_END
        status = 1;
    }

    // WHITEN
    void whiten() {
        int i = 0;
        if (status = 0) {  // status == 0
            return;
        }

        // WHITEN_LOOP
        while (i - screenEnd < 0) {
            ram[screenIdx + i] = 0;
            i++;
        }

        // WHITEN_END
        status = 0;
    }
}
```
