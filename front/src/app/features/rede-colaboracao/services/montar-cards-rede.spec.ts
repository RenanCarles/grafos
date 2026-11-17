import type { CardMetrica, CardNumeros, CardRanking } from '@app/shared/models/card-metrica';
import { criarCatalogoFake, criarRedeFake } from '@app/shared/testing/fixtures';
import { montarCardsRede } from './montar-cards-rede';

const numeros = (cards: CardMetrica[], id: string) =>
  cards.find((card) => card.id === id) as CardNumeros;
const ranking = (cards: CardMetrica[], id: string) =>
  cards.find((card) => card.id === id) as CardRanking;
const pares = (card: CardNumeros) => card.itens.map((item) => [item.rotulo, item.valor]);

describe('montarCardsRede', () => {
  const entrada = () => ({ rede: criarRedeFake(), catalogo: criarCatalogoFake() });

  it('gera os cinco cards na ordem do carrossel', () => {
    expect(montarCardsRede(entrada()).map((card) => card.id)).toEqual([
      'rede-geral',
      'rede-parceiros',
      'rede-pontes',
      'rede-integracao',
      'rede-grupos',
    ]);
  });

  it('resume pesquisadores, ligações e peso total', () => {
    const geral = numeros(montarCardsRede(entrada()), 'rede-geral');
    expect(pares(geral)).toEqual([
      ['Pesquisadores', '5'],
      ['Ligações', '4'],
      ['Peso total', '10,00'],
    ]);
  });

  it('conta cada par de pesquisadores uma vez, mesmo com várias relações e sentidos', () => {
    const base = criarRedeFake();
    const rede = {
      ...base,
      arestas: [
        { origemId: 'p1', destinoId: 'p2', tipo: 'coautoria' as const, peso: 1, ano: 2021 },
        { origemId: 'p2', destinoId: 'p1', tipo: 'coautoria' as const, peso: 1, ano: 2022 },
      ],
    };
    const geral = numeros(montarCardsRede({ rede, catalogo: criarCatalogoFake() }), 'rede-geral');
    expect(pares(geral)[1]).toEqual(['Ligações', '1']);
    expect(pares(geral)[2]).toEqual(['Peso total', '2,00']);
  });

  it('ranqueia os três com mais parceiros e desempata por nome', () => {
    const card = ranking(montarCardsRede(entrada()), 'rede-parceiros');
    expect(card.itens.map((item) => item.rotulo)).toEqual([
      'Ana Souza',
      'Bruno Lima',
      'Carla Dias',
    ]);
    expect(card.itens[0]).toEqual({
      posicao: 1,
      rotulo: 'Ana Souza',
      detalhe: 'IESTI · 3 parceiros',
    });
  });

  it('ranqueia os três com maior intermediação', () => {
    const card = ranking(montarCardsRede(entrada()), 'rede-pontes');
    expect(card.itens.map((item) => item.rotulo)).toEqual([
      'Ana Souza',
      'Carla Dias',
      'Bruno Lima',
    ]);
    expect(card.itens[0].detalhe).toBe('IESTI · 0,500');
  });

  it('calcula a fatia do peso que liga institutos diferentes', () => {
    const card = numeros(montarCardsRede(entrada()), 'rede-integracao');
    expect(pares(card)).toEqual([
      ['Peso entre institutos diferentes', '50,0%'],
      ['Institutos no recorte', '3'],
    ]);
  });

  it('mostra traço na integração quando não há peso', () => {
    const rede = { ...criarRedeFake(), arestas: [] };
    const card = numeros(
      montarCardsRede({ rede, catalogo: criarCatalogoFake() }),
      'rede-integracao',
    );
    expect(pares(card)[0]).toEqual(['Peso entre institutos diferentes', '—']);
  });

  it('resume os grupos com mais de uma pessoa', () => {
    const card = numeros(montarCardsRede(entrada()), 'rede-grupos');
    expect(pares(card)).toEqual([
      ['Grupos com 2 ou mais pessoas', '2'],
      ['Maior grupo', '2 pessoas'],
      ['Sem parceiro', '0'],
    ]);
    expect(card.nota).toContain('rede completa');
  });

  it('devolve só a visão geral, zerada, quando a rede está vazia', () => {
    const cards = montarCardsRede({
      rede: { nos: [], arestas: [] },
      catalogo: criarCatalogoFake(),
    });
    expect(cards.map((card) => card.id)).toEqual(['rede-geral']);
    expect(pares(numeros(cards, 'rede-geral'))).toEqual([
      ['Pesquisadores', '0'],
      ['Ligações', '0'],
      ['Peso total', '0,00'],
    ]);
  });
});
