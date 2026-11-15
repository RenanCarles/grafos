import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  AREAS_REPOSITORY,
  CATALOGO_REPOSITORY,
  METADADOS_REPOSITORY,
  REDE_REPOSITORY,
} from '@app/core/repositorios';
import { criarFiltrosPadrao } from '@app/shared/models/visao';
import {
  criarCatalogoFake,
  criarDadosAreasFake,
  criarRedeFake,
} from '@app/shared/testing/fixtures';
import { provideDados } from '../provide-dados';

describe('repositórios HTTP', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideDados()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('carrega o catálogo real sem preencher áreas artificialmente', async () => {
    const resultado = firstValueFrom(TestBed.inject(CATALOGO_REPOSITORY).obterCatalogo());
    const catalogo = { ...criarCatalogoFake(), areas: [] };
    http.expectOne('/api/catalogo').flush(catalogo);
    expect(await resultado).toEqual(catalogo);
  });

  it('envia período, institutos e peso fracionário, agregando antes do corte', async () => {
    const resultado = firstValueFrom(
      TestBed.inject(REDE_REPOSITORY).obterRede({
        ...criarFiltrosPadrao(),
        institutos: ['imc', 'iesti'],
        pesoMinimo: 0.1,
      }),
    );
    const pedido = http.expectOne((r) => r.url === '/api/rede');
    expect(pedido.request.params.get('agregar')).toBe('true');
    expect(pedido.request.params.get('pesoMinimo')).toBe('0.1');
    expect(pedido.request.params.get('institutos')).toBe('imc,iesti');
    expect(pedido.request.params.get('anoInicio')).toBe('2021');
    expect(pedido.request.params.get('anoFim')).toBe('2025');
    expect(pedido.request.params.get('areas')).toBe('');
    pedido.flush(criarRedeFake());
    expect((await resultado).nos).toHaveLength(5);
  });

  it('consulta áreas com a mesma agregação e permite uma lista vazia', async () => {
    const resultado = firstValueFrom(
      TestBed.inject(AREAS_REPOSITORY).obterAreas(criarFiltrosPadrao()),
    );
    const pedido = http.expectOne((r) => r.url === '/api/areas');
    expect(pedido.request.params.get('agregar')).toBe('true');
    pedido.flush({ ...criarDadosAreasFake(), areas: [] });
    expect((await resultado).areas).toEqual([]);
  });

  it('obtém a origem e o período dos dados no endpoint de metadados', async () => {
    const resultado = firstValueFrom(TestBed.inject(METADADOS_REPOSITORY).obterMetadados());
    http
      .expectOne((r) => r.url === '/api/meta')
      .flush({
        fonteNos: 'SIGAA',
        fonteArestas: 'OpenAlex',
        anos: '2021-2025',
        tipoRelacao: 'coautoria',
      });
    expect((await resultado).fonteArestas).toBe('OpenAlex');
  });

  it('propaga erros de conexão sem recorrer aos mocks', async () => {
    const resultado = firstValueFrom(
      TestBed.inject(REDE_REPOSITORY).obterRede(criarFiltrosPadrao()),
    );
    const rejeicao = expect(resultado).rejects.toMatchObject({ status: 0 });
    http.expectOne((r) => r.url === '/api/rede').error(new ProgressEvent('error'));
    await rejeicao;
  });

  it('envia os parâmetros Zanoli e exige a confirmação do modelo no resultado', async () => {
    const resultado = firstValueFrom(
      TestBed.inject(REDE_REPOSITORY).obterRede({
        ...criarFiltrosPadrao(),
        formulaPeso: 'zanoli',
        lambdaTemporal: 0,
        anoReferencia: 2025,
      }),
    );
    const pedido = http.expectOne((r) => r.url === '/api/rede');
    expect(pedido.request.params.get('formulaPeso')).toBe('zanoli');
    expect(pedido.request.params.get('lambdaTemporal')).toBe('0');
    expect(pedido.request.params.get('anoReferencia')).toBe('2025');
    pedido.flush({ ...criarRedeFake(), meta: { idFormula: 'zanoli' } });
    expect((await resultado).meta?.idFormula).toBe('zanoli');
  });

  it('rejeita uma API antiga que ignora a fórmula selecionada', async () => {
    const resultado = firstValueFrom(
      TestBed.inject(REDE_REPOSITORY).obterRede({ ...criarFiltrosPadrao(), formulaPeso: 'zanoli' }),
    );
    const rejeicao = expect(resultado).rejects.toThrow('não confirmou');
    http.expectOne((r) => r.url === '/api/rede').flush(criarRedeFake());
    await rejeicao;
  });

  it.each([
    ['/api/catalogo', () => firstValueFrom(TestBed.inject(CATALOGO_REPOSITORY).obterCatalogo())],
    [
      '/api/rede',
      () => firstValueFrom(TestBed.inject(REDE_REPOSITORY).obterRede(criarFiltrosPadrao())),
    ],
    [
      '/api/areas',
      () => firstValueFrom(TestBed.inject(AREAS_REPOSITORY).obterAreas(criarFiltrosPadrao())),
    ],
    ['/api/meta', () => firstValueFrom(TestBed.inject(METADADOS_REPOSITORY).obterMetadados())],
  ] as const)('rejeita resposta incompatível de %s', async (url, consultar) => {
    // Cada contrato deve rejeitar um envelope inválido em vez de parecer uma coleta vazia.
    const resultado = consultar();
    const rejeicao = expect(resultado).rejects.toThrow(/inválid/);
    http.expectOne((r) => r.url === url).flush({});
    await rejeicao;
  });
});
