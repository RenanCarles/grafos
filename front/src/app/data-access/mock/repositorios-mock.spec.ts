import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { criarFiltrosPadrao } from '@app/shared/models/visao';
import { LATENCIA_MOCK } from './latencia';
import { MockAreasRepository, MockCatalogoRepository, MockRedeRepository } from './repositorios-mock';

describe('repositórios mock', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LATENCIA_MOCK, useValue: { min: 0, max: 0 } },
        MockCatalogoRepository,
        MockRedeRepository,
        MockAreasRepository,
      ],
    });
  });

  it('catálogo devolve 6 institutos e 8 áreas', async () => {
    const catalogo = await firstValueFrom(TestBed.inject(MockCatalogoRepository).obterCatalogo());
    expect(catalogo.institutos).toHaveLength(6);
    expect(catalogo.areas).toHaveLength(8);
  });

  it('rede sem filtros devolve os 60 pesquisadores', async () => {
    const rede = await firstValueFrom(TestBed.inject(MockRedeRepository).obterRede(criarFiltrosPadrao()));
    expect(rede.nos).toHaveLength(60);
    expect(rede.arestas.length).toBeGreaterThan(30);
  });

  it('rede filtrada por instituto só traz pesquisadores dele', async () => {
    const rede = await firstValueFrom(
      TestBed.inject(MockRedeRepository).obterRede({ ...criarFiltrosPadrao(), institutos: ['iem'] }),
    );
    expect(rede.nos).toHaveLength(10);
    expect(rede.nos.every((n) => n.institutoId === 'iem')).toBe(true);
  });

  it('alterar o resultado não contamina chamadas seguintes', async () => {
    const repo = TestBed.inject(MockRedeRepository);
    const primeira = await firstValueFrom(repo.obterRede(criarFiltrosPadrao()));
    primeira.nos.length = 0;
    const segunda = await firstValueFrom(repo.obterRede(criarFiltrosPadrao()));
    expect(segunda.nos).toHaveLength(60);
  });

  it('áreas devolve todas as áreas e institutos, somando 60 pesquisadores nos institutos', async () => {
    const dados = await firstValueFrom(TestBed.inject(MockAreasRepository).obterAreas(criarFiltrosPadrao()));
    expect(dados.areas).toHaveLength(8);
    expect(dados.institutos).toHaveLength(6);
    expect(dados.institutos.reduce((soma, i) => soma + i.pesquisadores, 0)).toBe(60);
  });
});
