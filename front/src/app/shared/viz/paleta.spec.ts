import { CATEGORICA, CHROME, COR_OUTROS, SLOTS_REDE, corCategorica, corRede } from './paleta';

describe('paleta', () => {
  it('tem 8 cores hexadecimais únicas por modo', () => {
    for (const modo of ['claro', 'escuro'] as const) {
      const cores = CATEGORICA[modo];
      expect(cores).toHaveLength(8);
      expect(new Set(cores).size).toBe(8);
      for (const cor of cores) expect(cor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('corCategorica devolve a cor do slot e cai em "Outros" fora do intervalo', () => {
    expect(corCategorica('claro', 0)).toBe('#00909a');
    expect(corCategorica('escuro', 1)).toBe('#d4573f');
    expect(corCategorica('claro', 8)).toBe(COR_OUTROS.claro);
    expect(corCategorica('claro', -1)).toBe(COR_OUTROS.claro);
  });

  it('corRede usa apenas os slots validados para pares vizinhos (sem o oliva)', () => {
    expect(SLOTS_REDE).toEqual([0, 1, 2, 3, 4, 6]);
    expect(corRede('claro', 5)).toBe(CATEGORICA.claro[6]);
    expect(corRede('claro', 6)).toBe(COR_OUTROS.claro);
  });

  it('define as cores de superfície dos dois modos', () => {
    expect(CHROME.claro.superficie).toBe('#faf9f6');
    expect(CHROME.escuro.superficie).toBe('#17181a');
  });
});
