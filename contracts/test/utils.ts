import { createHash } from "node:crypto";

export const ZERO_8 = new Uint8Array(8);
export const ZERO_32 = new Uint8Array(32);
export const ZERO_256 = new Uint8Array(256);

export function bytesFromTextFixed(text: string, length: number): Uint8Array {
  const encoded = new TextEncoder().encode(text);
  const out = new Uint8Array(length);
  out.set(encoded.slice(0, length));
  return out;
}

export function bytes32FromText(text: string): Uint8Array {
  const encoded = new TextEncoder().encode(text);
  const out = new Uint8Array(32);
  out.set(encoded.slice(0, 32));
  return out;
}

export function sha256Bytes32(text: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(text).digest());
}

export function expectBytesEq(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    throw new Error(`byte length mismatch: ${a.length} != ${b.length}`);
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error(`byte mismatch at ${i}: ${a[i]} != ${b[i]}`);
    }
  }
}

