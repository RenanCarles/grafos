import { rankearTres } from './ranking';

interface Item {
  nome: string;
  n: number;
}

const criterios = {
  valor: (item: Item) => item.n,
  nome: (item: Item) => item.nome,
  detalhe: (item: Item) => `${item.n}`,
};

describe('rankearTres', () => {
  it('ordena do maior para o menor, limita a três e numera as posições', () => {
    const itens: Item[] = [
      { nome: 'A', n: 5 },
      { nome: 'D', n: 2 },
      { nome: 'B', n: 4 },
      { nome: 'C', n: 3 },
    ];
    expect(rankearTres(itens, criterios)).toEqual([
      { posicao: 1, rotulo: 'A', detalhe: '5' },
      { posicao: 2, rotulo: 'B', detalhe: '4' },
      { posicao: 3, rotulo: 'C', detalhe: '3' },
    ]);
  });

  it('desempata por nome em pt-BR', () => {
    const itens: Item[] = [
      { nome: 'Bruno', n: 2 },
      { nome: 'Ana', n: 2 },
      { nome: 'Álvaro', n: 2 },
    ];
    expect(rankearTres(itens, criterios).map((i) => i.rotulo)).toEqual(['Álvaro', 'Ana', 'Bruno']);
  });

  it('omite itens com valor zero', () => {
    expect(rankearTres([{ nome: 'A', n: 0 }], criterios)).toEqual([]);
  });

  it('não altera a lista original', () => {
    const itens: Item[] = [
      { nome: 'A', n: 1 },
      { nome: 'B', n: 2 },
    ];
    rankearTres(itens, criterios);
    expect(itens.map((i) => i.nome)).toEqual(['A', 'B']);
  });
});
