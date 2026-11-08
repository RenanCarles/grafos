import type { ElementDefinition } from 'cytoscape';
import { criarConfigRedePadrao } from '@app/shared/models/visao';
import { criarCatalogoFake, criarRedeFake } from '@app/shared/testing/fixtures';
import { COR_OUTROS, corRede } from '@app/shared/viz/paleta';
import { escalar, montarModeloRede, type EntradaRede, type ModeloRede } from './montar-modelo-rede';

const dado = (elemento: ElementDefinition, campo: string) => elemento.data[campo];
const nos = (modelo: ModeloRede) => modelo.elementos.filter((e) => e.group === 'nodes');
const arestas = (modelo: ModeloRede) => modelo.elementos.filter((e) => e.group === 'edges');
const noPorId = (modelo: ModeloRede, id: string) => nos(modelo).find((e) => dado(e, 'id') === id)!;

const montar = (sobrescrever: Partial<EntradaRede> = {}) =>
  montarModeloRede({
    rede: criarRedeFake(),
    catalogo: criarCatalogoFake(),
    config: criarConfigRedePadrao(),
    modo: 'claro',
    ...sobrescrever,
  });

describe('escalar', () => {
  it('interpola linearmente e centraliza quando min e max coincidem', () => {
    expect(escalar(5, 0, 10, 0, 100)).toBe(50);
    expect(escalar(0, 0, 10, 14, 44)).toBe(14);
    expect(escalar(3, 3, 3, 14, 44)).toBe(29);
  });
});

describe('montarModeloRede', () => {
  it('cria um nó por pesquisador e uma aresta por relação', () => {
    const modelo = montar();
    expect(nos(modelo)).toHaveLength(5);
    expect(arestas(modelo)).toHaveLength(4);
  });

  it('mostra só os tipos de relação escolhidos', () => {
    const modelo = montar({ config: { ...criarConfigRedePadrao(), tiposRelacao: ['coautoria'] } });
    expect(arestas(modelo)).toHaveLength(2);
    expect(arestas(modelo).every((a) => dado(a, 'tipo') === 'coautoria')).toBe(true);
  });

  it('só coloca rótulos quando pedido', () => {
    expect(dado(noPorId(montar(), 'p1'), 'label')).toBe('');
    const comRotulos = montar({ config: { ...criarConfigRedePadrao(), mostrarRotulos: true } });
    expect(dado(noPorId(comRotulos, 'p1'), 'label')).toBe('Ana Souza');
  });

  it('colore por instituto usando a paleta do modo', () => {
    const claro = montar();
    expect(dado(noPorId(claro, 'p1'), 'cor')).toBe(corRede('claro', 0));
    expect(dado(noPorId(claro, 'p3'), 'cor')).toBe(corRede('claro', 1));
    expect(dado(noPorId(montar({ modo: 'escuro' }), 'p1'), 'cor')).toBe(corRede('escuro', 0));
  });

  it('a cor segue a entidade: remover um instituto não repinta os demais', () => {
    const rede = criarRedeFake();
    rede.nos = rede.nos.filter((n) => n.institutoId !== 'i1');
    rede.arestas = [];
    expect(dado(noPorId(montar({ rede }), 'p3'), 'cor')).toBe(corRede('claro', 1));
  });

  it('colore por área (primeira área) e por comunidade', () => {
    const porArea = montar({ config: { ...criarConfigRedePadrao(), corPor: 'area' } });
    expect(dado(noPorId(porArea, 'p3'), 'cor')).toBe(corRede('claro', 1));
    const porComunidade = montar({ config: { ...criarConfigRedePadrao(), corPor: 'comunidade' } });
    expect(dado(noPorId(porComunidade, 'p5'), 'cor')).toBe(corRede('claro', 2));
  });

  it('agrupa em "Outros" o que passa dos 6 slots', () => {
    const rede = criarRedeFake();
    rede.nos[4].comunidade = 7;
    const modelo = montar({ rede, config: { ...criarConfigRedePadrao(), corPor: 'comunidade' } });
    expect(dado(noPorId(modelo, 'p5'), 'cor')).toBe(COR_OUTROS.claro);
    expect(modelo.legenda.at(-1)).toEqual({ rotulo: 'Outros', cor: COR_OUTROS.claro });
  });

  it('monta a legenda por instituto na ordem do catálogo', () => {
    expect(montar().legenda).toEqual([
      { rotulo: 'IESTI', cor: corRede('claro', 0) },
      { rotulo: 'IEM', cor: corRede('claro', 1) },
      { rotulo: 'IMC', cor: corRede('claro', 2) },
    ]);
    const porComunidade = montar({ config: { ...criarConfigRedePadrao(), corPor: 'comunidade' } });
    expect(porComunidade.legenda.map((i) => i.rotulo)).toEqual(['Grupo 1', 'Grupo 2', 'Grupo 3']);
  });

  it('dimensiona os nós pela métrica escolhida ou fixa', () => {
    const porGrau = montar({ config: { ...criarConfigRedePadrao(), tamanhoPor: 'grau' } });
    expect(dado(noPorId(porGrau, 'p1'), 'tamanho')).toBe(44);
    expect(dado(noPorId(porGrau, 'p4'), 'tamanho')).toBe(14);
    const fixo = montar({ config: { ...criarConfigRedePadrao(), tamanhoPor: 'fixo' } });
    expect(nos(fixo).every((n) => dado(n, 'tamanho') === 22)).toBe(true);
  });

  it('escolhe o layout conforme a configuração', () => {
    const nome = (layout: 'forca' | 'concentrico' | 'circulo') =>
      montar({ config: { ...criarConfigRedePadrao(), layout } }).layout.name;
    expect(nome('forca')).toBe('cose');
    expect(nome('concentrico')).toBe('concentric');
    expect(nome('circulo')).toBe('circle');
  });

  it('gera as linhas da tabela ordenadas por grau, com sigla e áreas', () => {
    const { linhas } = montar();
    expect(linhas.map((l) => l.nome)).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Rocha', 'Elisa Pinto']);
    expect(linhas[1]).toMatchObject({ instituto: 'IESTI', areas: 'Inteligência Artificial, Matemática Aplicada', grupo: 1 });
  });

  it('diferencia os tipos de relação por estilo de linha', () => {
    const estilo = montar().estilo as { selector: string; style: Record<string, unknown> }[];
    const linhaDe = (tipo: string) => estilo.find((regra) => regra.selector.includes(tipo))?.style;
    expect(linhaDe('orientacao')?.['line-style']).toBe('dotted');
    expect(linhaDe('projeto')?.['line-style']).toBe('dashed');
  });
});
