import type { NoRede } from '@app/shared/models/dominio';
import { criarFiltrosPadrao } from '@app/shared/models/visao';
import { agregarAreas, aplicarFiltros } from './filtros-mock';
import type { DadosMock } from './gerar-dados';

const no = (id: string, institutoId: string, areaIds: string[]): NoRede => ({
  id,
  nome: id,
  institutoId,
  areaIds,
  grau: 0,
  intermediacao: 0,
  comunidade: 0,
});

const dados: DadosMock = {
  institutos: [
    { id: 'A', sigla: 'A', nome: 'Instituto A' },
    { id: 'B', sigla: 'B', nome: 'Instituto B' },
    { id: 'C', sigla: 'C', nome: 'Instituto C' },
  ],
  areas: [
    { id: 'x', nome: 'Área X', grandeArea: 'G1' },
    { id: 'y', nome: 'Área Y', grandeArea: 'G2' },
  ],
  nos: [
    no('n1', 'A', ['x']),
    no('n2', 'A', ['x']),
    no('n3', 'B', ['x', 'y']),
    no('n4', 'C', ['y']),
  ],
  arestas: [
    { origemId: 'n1', destinoId: 'n2', tipo: 'coautoria', peso: 3, ano: 2022 },
    { origemId: 'n2', destinoId: 'n3', tipo: 'projeto', peso: 1, ano: 2021 },
  ],
};

describe('aplicarFiltros', () => {
  it('sem restrições devolve tudo', () => {
    const recorte = aplicarFiltros(dados, criarFiltrosPadrao());
    expect(recorte.nos).toHaveLength(4);
    expect(recorte.arestas).toHaveLength(2);
  });

  it('filtra por instituto e mantém só as arestas internas', () => {
    const recorte = aplicarFiltros(dados, { ...criarFiltrosPadrao(), institutos: ['A'] });
    expect(recorte.nos.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(recorte.arestas).toHaveLength(1);
  });

  it('filtra por área (basta ter uma das áreas)', () => {
    const recorte = aplicarFiltros(dados, { ...criarFiltrosPadrao(), areas: ['y'] });
    expect(recorte.nos.map((n) => n.id)).toEqual(['n3', 'n4']);
    expect(recorte.arestas).toHaveLength(0);
  });

  it('filtra por período e por peso mínimo', () => {
    expect(
      aplicarFiltros(dados, { ...criarFiltrosPadrao(), anoInicio: 2021, anoFim: 2021 }).arestas,
    ).toHaveLength(1);
    expect(aplicarFiltros(dados, { ...criarFiltrosPadrao(), pesoMinimo: 3 }).arestas).toHaveLength(
      1,
    );
  });
});

describe('agregarAreas', () => {
  it('conta pesquisadores, colaborações e distribuição por instituto', () => {
    const { areas } = agregarAreas(dados, criarFiltrosPadrao());
    const x = areas.find((a) => a.areaId === 'x')!;
    expect(x.pesquisadores).toBe(3);
    expect(x.colaboracoes).toBe(2);
    expect(x.porInstituto).toEqual({ A: 2, B: 1 });
  });

  it('marca como ponte a área que liga institutos sem relação direta', () => {
    const { areas } = agregarAreas(dados, criarFiltrosPadrao());
    expect(areas.find((a) => a.areaId === 'x')!.ehPonte).toBe(false);
    expect(areas.find((a) => a.areaId === 'y')!.ehPonte).toBe(true);
  });

  it('mantém todas as áreas e institutos do catálogo mesmo com zero pesquisadores', () => {
    const resultado = agregarAreas(dados, { ...criarFiltrosPadrao(), institutos: ['A'] });
    expect(resultado.areas.map((a) => a.areaId)).toEqual(['x', 'y']);
    expect(resultado.areas[1].pesquisadores).toBe(0);
    expect(resultado.institutos.map((i) => i.pesquisadores)).toEqual([2, 0, 0]);
  });
});
