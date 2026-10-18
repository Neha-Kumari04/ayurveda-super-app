/**
 * Small deterministic PRNG (mulberry32). Used by the mock data generators so
 * the dataset is identical on every app launch — important for reproducible
 * tests and stable list keys.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickMany<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const index = Math.floor(rng() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randomFloat(rng: () => number, min: number, max: number, decimals = 2): number {
  const value = min + rng() * (max - min);
  return Number(value.toFixed(decimals));
}
