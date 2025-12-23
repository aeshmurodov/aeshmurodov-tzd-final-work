/**
 * Реализация блочного шифра ГОСТ Р 34.12-2015 (Кузнечик)
 * Block size: 128 bits
 * Key size: 256 bits
 */

// Таблица нелинейного биективного преобразования (Pi)
const Pi = new Uint8Array([
  252, 238, 221, 17, 207, 110, 49, 22, 251, 196, 250, 218, 35, 197, 4, 77,
  233, 119, 240, 219, 147, 46, 153, 186, 23, 54, 241, 187, 20, 205, 95, 193,
  249, 24, 101, 90, 226, 92, 239, 33, 129, 28, 60, 66, 139, 1, 142, 79,
  5, 132, 2, 174, 74, 85, 206, 81, 109, 112, 94, 157, 56, 15, 16, 156,
  118, 29, 40, 253, 42, 105, 43, 108, 243, 247, 34, 134, 135, 11, 230, 25,
  89, 217, 222, 127, 213, 190, 80, 203, 229, 171, 55, 141, 88, 170, 246, 175,
  198, 202, 182, 136, 166, 63, 114, 244, 228, 97, 188, 200, 163, 6, 195, 179,
  162, 215, 59, 133, 209, 242, 154, 9, 237, 211, 224, 30, 146, 126, 172, 225,
  212, 208, 165, 116, 32, 53, 235, 151, 192, 216, 149, 93, 227, 102, 38, 52,
  232, 103, 130, 84, 138, 189, 73, 178, 111, 234, 71, 122, 45, 143, 39, 75,
  10, 78, 236, 168, 50, 76, 21, 65, 98, 86, 117, 184, 18, 150, 48, 191,
  148, 125, 161, 99, 19, 167, 160, 155, 36, 96, 68, 183, 13, 83, 201, 14,
  82, 91, 100, 107, 72, 69, 245, 106, 204, 214, 199, 210, 152, 220, 58, 223,
  131, 8, 231, 173, 7, 70, 31, 140, 212, 37, 254, 51, 113, 248, 27, 158,
  177, 87, 169, 137, 67, 194, 3, 255, 57, 212, 144, 145, 124, 120, 185, 180,
  181, 121, 128, 123, 159, 164, 26, 64, 115, 12, 212, 47, 44, 61, 41, 104
]);

// Обратная таблица (Reverse Pi) - для расшифрования (если используется не CTR режим)
const reversePi = new Uint8Array(256);
for (let i = 0; i < 256; i++) reversePi[Pi[i]] = i;

// Коэффициенты для линейного преобразования (lvec)
const lVec = new Uint8Array([148, 32, 133, 16, 194, 192, 1, 251, 1, 192, 194, 16, 133, 32, 148, 1]);

// Таблица умножения в поле Галуа GF(2^8)
const GF = new Uint8Array(256 * 256);

// Инициализация таблицы умножения GF
(function initGF() {
  for (let i = 0; i < 256; i++) {
    for (let j = 0; j < 256; j++) {
      let p = 0;
      let a = i;
      let b = j;
      for (let k = 0; k < 8; k++) {
        if ((b & 1) === 1) p ^= a;
        const hi_bit_set = (a & 0x80) === 0x80;
        a <<= 1;
        if (hi_bit_set) a ^= 0xc3; // Полином x^8 + x^7 + x^6 + x + 1
        b >>= 1;
      }
      GF[i * 256 + j] = p & 0xff;
    }
  }
})();

function multiplyGF(x: number, y: number): number {
  return GF[x * 256 + y];
}

export class Kuznechik {
  private keys: Uint8Array[]; // Раундовые ключи (10 штук по 16 байт)

  constructor(key: Buffer | Uint8Array) {
    if (key.length !== 32) {
      throw new Error("Kuznechik key must be 32 bytes (256 bits)");
    }

    // Создаем новый Uint8Array, копируя значения.
    // Это гарантирует, что мы работаем с чистым Uint8Array, отвязанным от Buffer.buffer
    const masterKey = new Uint8Array(key);
    this.keys = this.expandKey(masterKey);
  }

  // Генерация раундовых ключей
  private expandKey(key: Uint8Array): Uint8Array[] {
    const keys: Uint8Array[] = new Array(10);
    
    // Используем .slice самого Uint8Array, а не буфера
    // Это корректно работает с типами в TypeScript
    const k1 = key.slice(0, 16);
    const k2 = key.slice(16, 32);
    
    keys[0] = k1;
    keys[1] = k2;

    const c = new Array(32);
    for (let i = 0; i < 32; i++) {
      c[i] = new Uint8Array(16);
      c[i].set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, i + 1]);
      c[i] = this.L(c[i]);
    }

    let temp1 = k1;
    let temp2 = k2;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 8; j++) {
        const tmp = this.X(temp1, c[i * 8 + j]); // X
        const s_tmp = this.S(tmp); // S
        const l_tmp = this.L(s_tmp); // L
        const next = this.X(l_tmp, temp2); // X
        temp2 = temp1;
        temp1 = next;
      }
      keys[2 * i + 2] = temp1;
      keys[2 * i + 3] = temp2;
    }

    return keys;
  }

  // Линейное преобразование L
  private L(block: Uint8Array): Uint8Array {
    // Создаем копию для работы
    let state = new Uint8Array(block);

    // Полная реализация L через R-функцию (16 итераций)
    for(let i = 0; i < 16; i++) {
       state = this.R(state);
    }
    return state;
  }
  
  private R(state: Uint8Array): Uint8Array {
      let a15 = 0;
      for(let i = 0; i < 16; i++) {
          a15 ^= multiplyGF(state[i], lVec[i]);
      }
      const result = new Uint8Array(16);
      result.set(state.slice(1, 16), 0); // сдвиг влево
      result[15] = a15;
      return result;
  }

  // Нелинейное преобразование S
  private S(block: Uint8Array): Uint8Array {
    const res = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      res[i] = Pi[block[i]];
    }
    return res;
  }

  // XOR операция X
  private X(a: Uint8Array, b: Uint8Array): Uint8Array {
    const res = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      res[i] = a[i] ^ b[i];
    }
    return res;
  }

  // Шифрование одного блока (16 байт)
  public encryptBlock(block: Uint8Array): Uint8Array {
    if (block.length !== 16) throw new Error("Block size must be 16 bytes");
    
    // Создаем копию
    let state = new Uint8Array(block);
    
    for (let i = 0; i < 9; i++) {
      state = this.X(state, this.keys[i]); // X
      state = this.S(state); // S
      state = this.L(state); // L
    }
    
    state = this.X(state, this.keys[9]); // Final X
    return state;
  }
}