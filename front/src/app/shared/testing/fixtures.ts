import type { Provider } from '@angular/core';
import { of } from 'rxjs';
import {
  AREAS_REPOSITORY,
  METADADOS_REPOSITORY,
  CATALOGO_REPOSITORY,
  REDE_REPOSITORY,
  type AreasRepository,
  type Catalogo,
  type CatalogoRepository,
  type RedeRepository,
} from '@app/core/repositorios';
import type { Area, DadosAreas, Instituto, Rede } from '@app/shared/models/dominio';
import {
  criarConfigAreasPadrao,
  criarConfigRedePadrao,
  criarFiltrosPadrao,
  type VisaoAreas,
  type VisaoRede,
} from '@app/shared/models/visao';

export const INSTITUTOS_FAKE: Instituto[] = [
  { id: 'i1', sigla: 'IESTI', nome: 'Sistemas e Tecnologia da Informação' },
  { id: 'i2', sigla: 'IEM', nome: 'Engenharia Mecânica' },
  { id: 'i3', sigla: 'IMC', nome: 'Matemática e Computação' },
];

export const AREAS_FAKE: Area[] = [
  { id: 'a1', nome: 'Inteligência Artificial', grandeArea: 'Ciências Exatas e da Terra' },
  { id: 'a2', nome: 'Mecânica e Materiais', grandeArea: 'Engenharias' },
  { id: 'a3', nome: 'Matemática Aplicada', grandeArea: 'Ciências Exatas e da Terra' },
];

export function criarCatalogoFake(): Catalogo {
  return { institutos: structuredClone(INSTITUTOS_FAKE), areas: structuredClone(AREAS_FAKE) };
}

export function criarRedeFake(): Rede {
  return {
    nos: [
      {
        id: 'p1',
        nome: 'Ana Souza',
        institutoId: 'i1',
        areaIds: ['a1'],
        grau: 3,
        intermediacao: 0.5,
        comunidade: 0,
        vizinhosFora: 1,
        institutosDoGrupo: ['IESTI'],
      },
      {
        id: 'p2',
        nome: 'Bruno Lima',
        institutoId: 'i1',
        areaIds: ['a1', 'a3'],
        grau: 2,
        intermediacao: 0.1,
        comunidade: 0,
        vizinhosFora: 1,
        institutosDoGrupo: ['IESTI'],
      },
      {
        id: 'p3',
        nome: 'Carla Dias',
        institutoId: 'i2',
        areaIds: ['a2'],
        grau: 2,
        intermediacao: 0.2,
        comunidade: 1,
      },
      {
        id: 'p4',
        nome: 'Diego Rocha',
        institutoId: 'i2',
        areaIds: ['a2'],
        grau: 1,
        intermediacao: 0,
        comunidade: 1,
      },
      {
        id: 'p5',
        nome: 'Elisa Pinto',
        institutoId: 'i3',
        areaIds: ['a3'],
        grau: 1,
        intermediacao: 0,
        comunidade: 2,
      },
    ],
    arestas: [
      { origemId: 'p1', destinoId: 'p2', tipo: 'coautoria', peso: 4, ano: 2022 },
      { origemId: 'p1', destinoId: 'p3', tipo: 'projeto', peso: 2, ano: 2023 },
      { origemId: 'p3', destinoId: 'p4', tipo: 'orientacao', peso: 1, ano: 2021 },
      { origemId: 'p2', destinoId: 'p5', tipo: 'coautoria', peso: 3, ano: 2024 },
    ],
    meta: {
      fonteNos: 'SIGAA UNIFEI',
      fonteArestas: 'OpenAlex',
      anos: '2021-2025',
      tipoRelacao: 'coautoria',
      geradoEm: '2026-11-13T22:21:22Z',
      leituraGrupos: {
        texto:
          'Reimberg e Zanoli têm, cada uma, 1 grupo com mais de uma pessoa; 1 deles reúne institutos diferentes.',
      },
    },
  };
}

export function criarDadosAreasFake(): DadosAreas {
  return {
    areas: [
      {
        areaId: 'a1',
        nome: 'Inteligência Artificial',
        grandeArea: 'Ciências Exatas e da Terra',
        pesquisadores: 2,
        colaboracoes: 1,
        ehPonte: false,
        porInstituto: { i1: 2 },
      },
      {
        areaId: 'a2',
        nome: 'Mecânica e Materiais',
        grandeArea: 'Engenharias',
        pesquisadores: 2,
        colaboracoes: 1,
        ehPonte: false,
        porInstituto: { i2: 2 },
      },
      {
        areaId: 'a3',
        nome: 'Matemática Aplicada',
        grandeArea: 'Ciências Exatas e da Terra',
        pesquisadores: 2,
        colaboracoes: 1,
        ehPonte: true,
        porInstituto: { i1: 1, i3: 1 },
      },
    ],
    institutos: [
      {
        institutoId: 'i1',
        sigla: 'IESTI',
        nome: 'Sistemas e Tecnologia da Informação',
        pesquisadores: 2,
      },
      { institutoId: 'i2', sigla: 'IEM', nome: 'Engenharia Mecânica', pesquisadores: 2 },
      { institutoId: 'i3', sigla: 'IMC', nome: 'Matemática e Computação', pesquisadores: 1 },
    ],
  };
}

export function criarVisaoRedeFake(sobrescrever: Partial<VisaoRede> = {}): VisaoRede {
  return {
    id: 'v-rede',
    nome: 'Rede de teste',
    descricao: 'Visão de rede para testes',
    tipo: 'rede',
    filtros: criarFiltrosPadrao(),
    config: criarConfigRedePadrao(),
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-02T00:00:00.000Z',
    ...sobrescrever,
  };
}

export function criarVisaoAreasFake(sobrescrever: Partial<VisaoAreas> = {}): VisaoAreas {
  return {
    id: 'v-areas',
    nome: 'Áreas de teste',
    descricao: 'Visão de áreas para testes',
    tipo: 'areas',
    filtros: criarFiltrosPadrao(),
    config: criarConfigAreasPadrao(),
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-02T00:00:00.000Z',
    ...sobrescrever,
  };
}

export function provedoresDadosFake(): Provider[] {
  const catalogo: CatalogoRepository = { obterCatalogo: () => of(criarCatalogoFake()) };
  const rede: RedeRepository = { obterRede: () => of(criarRedeFake()) };
  const areas: AreasRepository = { obterAreas: () => of(criarDadosAreasFake()) };
  return [
    {
      provide: METADADOS_REPOSITORY,
      useValue: {
        obterMetadados: () =>
          of({
            fonteNos: 'SIGAA UNIFEI',
            fonteArestas: 'OpenAlex',
            anos: '2021-2025',
            tipoRelacao: 'coautoria',
            geradoEm: '2026-11-13T22:21:22Z',
          }),
      },
    },
    { provide: CATALOGO_REPOSITORY, useValue: catalogo },
    { provide: REDE_REPOSITORY, useValue: rede },
    { provide: AREAS_REPOSITORY, useValue: areas },
  ];
}
