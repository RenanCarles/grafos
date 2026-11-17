import type { CardMetrica, CardNumeros, CardRanking } from '@app/shared/models/card-metrica';
import { criarDadosAreasFake } from '@app/shared/testing/fixtures';
import { montarCardsAreas } from './montar-cards-areas';

const numeros = (cards: CardMetrica[], id: string) =>
  cards.find((card) => card.id === id) as CardNumeros;
const ranking = (cards: CardMetrica[], id: string) =>
  cards.find((card) => card.id === id) as CardRanking;

describe('montarCardsAreas', () => {
  it('gera os quatro cards na ordem do carrossel', () => {
    expect(montarCardsAreas(criarDadosAreasFake()).map((card) => card.id)).toEqual([
      'areas-geral',
      'areas-pesquisadores',
      'areas-colaboracoes',
      'areas-pontes',
    ]);
  });

  it('conta as áreas com pesquisadores entre as do catálogo', () => {
    const dados = criarDadosAreasFake();
    dados.areas[2] = { ...dados.areas[2], pesquisadores: 0 };
    const geral = numeros(montarCardsAreas(dados), 'areas-geral');
    expect(geral.itens).toEqual([{ rotulo: 'Áreas com pesquisadores', valor: '2 de 3' }]);
  });

  it('ranqueia por pesquisadores e por colaborações, desempatando por nome', () => {
    const cards = montarCardsAreas(criarDadosAreasFake());
    const esperado = ['Inteligência Artificial', 'Matemática Aplicada', 'Mecânica e Materiais'];
    expect(ranking(cards, 'areas-pesquisadores').itens.map((i) => i.rotulo)).toEqual(esperado);
    expect(ranking(cards, 'areas-colaboracoes').itens.map((i) => i.rotulo)).toEqual(esperado);
    expect(ranking(cards, 'areas-pesquisadores').itens[0].detalhe).toBe('2 pesquisadores');
    expect(ranking(cards, 'areas-colaboracoes').itens[0].detalhe).toBe('1 colaboração');
  });

  it('lista as áreas-ponte com a contagem no título', () => {
    const card = ranking(montarCardsAreas(criarDadosAreasFake()), 'areas-pontes');
    expect(card.titulo).toBe('Áreas-ponte (1)');
    expect(card.itens).toEqual([
      { posicao: 1, rotulo: 'Matemática Aplicada', detalhe: '2 pesquisadores' },
    ]);
  });

  it('mostra zero áreas-ponte com a lista vazia', () => {
    const dados = criarDadosAreasFake();
    dados.areas = dados.areas.map((area) => ({ ...area, ehPonte: false }));
    const card = ranking(montarCardsAreas(dados), 'areas-pontes');
    expect(card.titulo).toBe('Áreas-ponte (0)');
    expect(card.itens).toEqual([]);
  });

  it('avisa em um único card quando o backend não trouxe áreas', () => {
    const cards = montarCardsAreas({ ...criarDadosAreasFake(), areas: [] });
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('areas-indisponiveis');
    expect(cards[0].itens).toEqual([]);
    expect(cards[0].nota).toContain('não estão disponíveis');
  });
});
