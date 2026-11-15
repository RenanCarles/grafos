import { criarConfigRedePadrao, criarFiltrosPadrao, type Visao } from '@app/shared/models/visao';

/** Configurações iniciais para a coleta real, sem excluir laços fracos. */
export function criarVisoesIniciais(agora: string): Visao[] {
  const base = { filtros: criarFiltrosPadrao(), criadoEm: agora, atualizadoEm: agora };
  return [
    {
      ...base,
      id: 'visao-colaboracao-institutos',
      nome: 'Colaboração entre institutos',
      descricao: 'Rede de coautoria de 2021–2025, com cor por instituto.',
      tipo: 'rede',
      config: criarConfigRedePadrao(),
    },
    {
      ...base,
      filtros: criarFiltrosPadrao(),
      id: 'visao-pontes-centralidade',
      nome: 'Pontes e centralidade',
      descricao:
        'Comunidades de colaboração e pesquisadores com maior intermediação na rede completa.',
      tipo: 'rede',
      config: { ...criarConfigRedePadrao(), corPor: 'comunidade', tamanhoPor: 'intermediacao' },
    },
  ];
}
