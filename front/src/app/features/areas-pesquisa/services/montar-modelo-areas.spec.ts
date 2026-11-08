import type { DadosAreas } from '@app/shared/models/dominio';
import { criarConfigAreasPadrao } from '@app/shared/models/visao';
import { criarDadosAreasFake } from '@app/shared/testing/fixtures';
import { CHROME, corCategorica, corRede } from '@app/shared/viz/paleta';
import { montarModeloAreas, type EntradaAreas } from './montar-modelo-areas';

interface Serie {
  name: string;
  data: unknown[];
  itemStyle: { color: string };
}

interface No {
  name: string;
  value?: number;
  children?: No[];
  itemStyle: { color: string; opacity?: number };
  label?: { color: string };
}

const montar = (sobrescrever: Partial<EntradaAreas> = {}) =>
  montarModeloAreas({ dados: criarDadosAreasFake(), config: criarConfigAreasPadrao(), modo: 'claro', ...sobrescrever });

const series = (opcoes: unknown) => (opcoes as { series: Serie[] }).series;
const categorias = (opcoes: unknown) => (opcoes as { yAxis: { data: string[] } }).yAxis.data;
const arvore = (opcoes: unknown) => (opcoes as { series: { data: No[] }[] }).series[0].data;

describe('montarModeloAreas: barras', () => {
  it('com destaque cria duas séries empilhadas e a legenda correspondente', () => {
    const modelo = montar();
    const [ponte, demais] = series(modelo.opcoes);
    expect(ponte.name).toBe('Área-ponte');
    expect(demais.name).toBe('Demais áreas');
    expect(categorias(modelo.opcoes)).toEqual(['Inteligência Artificial', 'Matemática Aplicada', 'Mecânica e Materiais']);
    expect(ponte.data).toEqual([null, 2, null]);
    expect(demais.data).toEqual([2, null, 2]);
    expect(modelo.legenda).toEqual([
      { rotulo: 'Área-ponte', cor: corCategorica('claro', 1) },
      { rotulo: 'Demais áreas', cor: corCategorica('claro', 0) },
    ]);
  });

  it('sem destaque usa uma série na cor do slot 0 e nenhuma legenda', () => {
    const modelo = montar({ config: { ...criarConfigAreasPadrao(), destacarAreasPonte: false } });
    expect(series(modelo.opcoes)).toHaveLength(1);
    expect(series(modelo.opcoes)[0].itemStyle.color).toBe(corCategorica('claro', 0));
    expect(modelo.legenda).toEqual([]);
  });

  it('ordena do maior para o menor, corta no topN e ignora áreas sem pesquisadores', () => {
    const dados: DadosAreas = criarDadosAreasFake();
    dados.areas[0].pesquisadores = 5;
    dados.areas[1].pesquisadores = 0;
    dados.areas[2].pesquisadores = 3;
    expect(categorias(montar({ dados }).opcoes)).toEqual(['Inteligência Artificial', 'Matemática Aplicada']);
    const cortado = montar({ dados, config: { ...criarConfigAreasPadrao(), topN: 1 } });
    expect(categorias(cortado.opcoes)).toEqual(['Inteligência Artificial']);
  });

  it('agrupando por instituto usa as siglas e não destaca pontes', () => {
    const modelo = montar({ config: { ...criarConfigAreasPadrao(), agruparPor: 'instituto' } });
    expect(categorias(modelo.opcoes)).toEqual(['IEM', 'IESTI', 'IMC']);
    expect(series(modelo.opcoes)).toHaveLength(1);
    expect(modelo.linhas.every((linha) => linha.ponte === null)).toBe(true);
  });

  it('gera as linhas da tabela com grande área, pesquisadores, colaborações e ponte', () => {
    const { linhas } = montar();
    expect(linhas).toContainEqual({
      nome: 'Matemática Aplicada',
      grupo: 'Ciências Exatas e da Terra',
      pesquisadores: 2,
      colaboracoes: 1,
      ponte: true,
    });
  });

  it('marca como vazio quando nenhuma área tem pesquisadores', () => {
    const dados = criarDadosAreasFake();
    dados.areas.forEach((area) => (area.pesquisadores = 0));
    const modelo = montar({ dados });
    expect(modelo.vazio).toBe(true);
    expect(modelo.linhas).toEqual([]);
  });
});

describe('montarModeloAreas: treemap e sunburst', () => {
  const treemap = { ...criarConfigAreasPadrao(), grafico: 'treemap' as const, destacarAreasPonte: false };

  it('agrupa por grande área com cor estável mesmo quando um grupo some', () => {
    const completo = arvore(montar({ config: treemap }).opcoes);
    expect(completo.map((no) => no.name)).toEqual(['Ciências Exatas e da Terra', 'Engenharias']);

    const dados = criarDadosAreasFake();
    dados.areas[0].pesquisadores = 0;
    dados.areas[2].pesquisadores = 0;
    const filtrado = arvore(montar({ dados, config: treemap }).opcoes);
    expect(filtrado.map((no) => no.name)).toEqual(['Engenharias']);
    expect(filtrado[0].itemStyle.color).toBe(corCategorica('claro', 1));
  });

  it('esmaece as áreas que não são ponte quando o destaque está ligado', () => {
    const modelo = montar({ config: { ...treemap, destacarAreasPonte: true } });
    const folhas = arvore(modelo.opcoes).flatMap((grupo) => grupo.children ?? []);
    const grupo = corCategorica('claro', 0);
    const esmaecida = folhas.find((f) => f.name === 'Inteligência Artificial')!.itemStyle;
    expect(esmaecida.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(esmaecida.color).not.toBe(grupo);
    expect(esmaecida.opacity).toBeUndefined();
    expect(folhas.find((f) => f.name === 'Matemática Aplicada')?.itemStyle.color).toBe(grupo);
    expect(modelo.nota).toContain('Áreas-ponte em destaque');
  });

  it('usa rótulo escuro nas áreas esmaecidas para manter o contraste, e claro nas demais', () => {
    const modelo = montar({ config: { ...treemap, destacarAreasPonte: true } });
    const folhas = arvore(modelo.opcoes).flatMap((grupo) => grupo.children ?? []);
    expect(folhas.find((f) => f.name === 'Inteligência Artificial')?.label?.color).toBe(CHROME.claro.tinta);
    expect(folhas.find((f) => f.name === 'Matemática Aplicada')?.label?.color).toBe(CHROME.claro.superficie);
  });

  it('lista na legenda só os grupos presentes, com a cor do grupo', () => {
    expect(montar({ config: treemap }).legenda).toEqual([
      { rotulo: 'Ciências Exatas e da Terra', cor: corCategorica('claro', 0) },
      { rotulo: 'Engenharias', cor: corCategorica('claro', 1) },
    ]);
  });

  it('sunburst por instituto usa os institutos como raiz e a paleta da rede', () => {
    const modelo = montar({ config: { ...criarConfigAreasPadrao(), grafico: 'sunburst', agruparPor: 'instituto' } });
    const raiz = arvore(modelo.opcoes);
    expect(raiz.map((no) => no.name)).toEqual(['IESTI', 'IEM', 'IMC']);
    expect(raiz[0].itemStyle.color).toBe(corRede('claro', 0));
    expect(raiz[0].children?.map((f) => [f.name, f.value])).toEqual([
      ['Inteligência Artificial', 2],
      ['Matemática Aplicada', 1],
    ]);
  });
});
