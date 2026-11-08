import {
  criarConfigAreasPadrao,
  criarConfigRedePadrao,
  criarFiltrosPadrao,
  type Visao,
} from '@app/shared/models/visao';

export function criarVisoesIniciais(agora: string): Visao[] {
  return [
    {
      id: 'visao-colaboracao-institutos',
      nome: 'Colaboração entre institutos',
      descricao: 'Quem colabora com quem, com cor por instituto e tamanho pelo número de parceiros.',
      tipo: 'rede',
      filtros: criarFiltrosPadrao(),
      config: { ...criarConfigRedePadrao(), corPor: 'instituto', tamanhoPor: 'grau' },
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'visao-pontes-centralidade',
      nome: 'Pontes e centralidade',
      descricao: 'Agrupamentos de colaboração e pesquisadores que conectam grupos, com tamanho por intermediação.',
      tipo: 'rede',
      filtros: { ...criarFiltrosPadrao(), pesoMinimo: 2 },
      config: { ...criarConfigRedePadrao(), corPor: 'comunidade', tamanhoPor: 'intermediacao' },
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'visao-areas-dominantes',
      nome: 'Áreas dominantes',
      descricao: 'Principais áreas de pesquisa, destacando as que conectam institutos sem colaboração direta.',
      tipo: 'areas',
      filtros: criarFiltrosPadrao(),
      config: criarConfigAreasPadrao(),
      criadoEm: agora,
      atualizadoEm: agora,
    },
  ];
}
