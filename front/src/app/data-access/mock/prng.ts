export type Prng = () => number;

export function criarPrng(semente: number): Prng {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sortearInteiro(prng: Prng, min: number, max: number): number {
  return min + Math.floor(prng() * (max - min + 1));
}

export function sortearItem<T>(prng: Prng, itens: readonly T[]): T {
  return itens[Math.floor(prng() * itens.length)];
}

export function sortearPonderado<T>(prng: Prng, opcoes: readonly { item: T; peso: number }[]): T {
  const total = opcoes.reduce((soma, opcao) => soma + opcao.peso, 0);
  let alvo = prng() * total;
  for (const opcao of opcoes) {
    alvo -= opcao.peso;
    if (alvo < 0) return opcao.item;
  }
  return opcoes[opcoes.length - 1].item;
}
