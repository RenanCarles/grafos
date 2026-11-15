import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { VISOES_REPOSITORY } from '@app/core/repositorios';
import { criarConfigRedePadrao, criarFiltrosPadrao, type Visao } from '@app/shared/models/visao';
import { provideDados } from '../provide-dados';

const CHAVE = 'mapa-colaboracao:visoes:reais:v1';
const MARCADOR = 'mapa-colaboracao:visoes:reais:v1:arquivos';
const CHAVE_ANTIGA = 'mapa-colaboracao:visoes:v1';

const visao = (id: string, nome = 'Colaboração entre institutos'): Visao => ({
  id,
  nome,
  descricao: 'Rede de coautoria.',
  tipo: 'rede',
  filtros: criarFiltrosPadrao(),
  config: criarConfigRedePadrao(),
  criadoEm: '2026-11-01T00:00:00.000Z',
  atualizadoEm: '2026-11-01T00:00:00.000Z',
});

describe('visões em arquivos', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideDados()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('aceita uma lista vazia e passa a consultar só os arquivos', async () => {
    const resultado = firstValueFrom(TestBed.inject(VISOES_REPOSITORY).listar());
    http.expectOne('/api/visoes').flush([]);
    expect(await resultado).toEqual([]);
    expect(localStorage.getItem(MARCADOR)).toBe('1');

    const deNovo = firstValueFrom(TestBed.inject(VISOES_REPOSITORY).listar());
    http.expectOne('/api/visoes').flush([visao('visao-colaboracao-institutos')]);
    expect(await deNovo).toHaveLength(1);
    http.expectNone('/api/visoes/importar');
  });

  it('copia a visão do navegador uma vez e não mexe na chave antiga', async () => {
    const antiga = JSON.stringify([{ id: 'mock', filtros: { pesoMinimo: 1 } }]);
    localStorage.setItem(CHAVE_ANTIGA, antiga);
    localStorage.setItem(
      CHAVE,
      JSON.stringify([
        visao('visao-colaboracao-institutos'),
        { ...visao('visao-do-grupo', 'Comuidades'), descricao: 'Filtro do grupo' },
      ]),
    );

    const resultado = firstValueFrom(TestBed.inject(VISOES_REPOSITORY).listar());
    http.expectOne('/api/visoes').flush([visao('visao-colaboracao-institutos')]);
    const importacao = http.expectOne('/api/visoes/importar');
    expect(importacao.request.body).toMatchObject({ id: 'visao-do-grupo', nome: 'Comunidades' });
    importacao.flush(visao('visao-do-grupo', 'Comunidades'));
    http
      .expectOne('/api/visoes')
      .flush([visao('visao-colaboracao-institutos'), visao('visao-do-grupo', 'Comunidades')]);

    expect((await resultado).map((item) => item.nome)).toEqual([
      'Colaboração entre institutos',
      'Comunidades',
    ]);
    expect(localStorage.getItem(CHAVE_ANTIGA)).toBe(antiga);
    expect(localStorage.getItem(MARCADOR)).toBe('1');
  });

  it('grava uma visão nova no arquivo da API', async () => {
    localStorage.setItem(MARCADOR, '1');
    const resultado = firstValueFrom(
      TestBed.inject(VISOES_REPOSITORY).criar({
        nome: 'Grupo',
        descricao: '',
        tipo: 'rede',
        filtros: criarFiltrosPadrao(),
        config: criarConfigRedePadrao(),
      }),
    );
    const pedido = http.expectOne('/api/visoes');
    expect(pedido.request.method).toBe('POST');
    expect(pedido.request.body).toMatchObject({ nome: 'Grupo' });
    pedido.flush(visao('nova', 'Grupo'));
    expect((await resultado).id).toBe('nova');
  });

  it('rejeita lista incompatível e mantém a cópia do navegador pendente', async () => {
    const resultado = firstValueFrom(TestBed.inject(VISOES_REPOSITORY).listar());
    const rejeicao = expect(resultado).rejects.toThrow(
      'lista de visões recebida da API é inválida',
    );
    http.expectOne('/api/visoes').flush({ visoes: [] });
    await rejeicao;
    expect(localStorage.getItem(MARCADOR)).toBeNull();
  });

  it('propaga falha de conexão sem usar o que está no navegador', async () => {
    localStorage.setItem(CHAVE, JSON.stringify([visao('visao-do-grupo', 'Comunidades')]));
    const resultado = firstValueFrom(TestBed.inject(VISOES_REPOSITORY).listar());
    const rejeicao = expect(resultado).rejects.toMatchObject({ status: 0 });
    http.expectOne('/api/visoes').error(new ProgressEvent('error'));
    await rejeicao;
    expect(localStorage.getItem(MARCADOR)).toBeNull();
    expect(localStorage.getItem(CHAVE)).toContain('Comunidades');
  });
});
