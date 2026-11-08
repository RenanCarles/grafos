import { criarPrng, sortearInteiro, sortearItem, sortearPonderado } from './prng';

describe('prng', () => {
  it('produz a mesma sequência para a mesma semente', () => {
    const a = criarPrng(42);
    const b = criarPrng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produz sequências diferentes para sementes diferentes', () => {
    expect(criarPrng(1)()).not.toBe(criarPrng(2)());
  });

  it('gera valores em [0, 1)', () => {
    const prng = criarPrng(7);
    for (let i = 0; i < 1000; i++) {
      const valor = prng();
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });

  it('sortearInteiro respeita os limites inclusivos', () => {
    const prng = criarPrng(3);
    const valores = new Set<number>();
    for (let i = 0; i < 500; i++) valores.add(sortearInteiro(prng, 2, 5));
    expect([...valores].sort()).toEqual([2, 3, 4, 5]);
  });

  it('sortearItem devolve elementos da lista', () => {
    const prng = criarPrng(9);
    for (let i = 0; i < 50; i++) expect(['a', 'b', 'c']).toContain(sortearItem(prng, ['a', 'b', 'c']));
  });

  it('sortearPonderado nunca escolhe peso zero', () => {
    const prng = criarPrng(11);
    for (let i = 0; i < 200; i++) {
      expect(sortearPonderado(prng, [{ item: 'x', peso: 0 }, { item: 'y', peso: 5 }])).toBe('y');
    }
  });
});
