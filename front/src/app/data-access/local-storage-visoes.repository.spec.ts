import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { criarConfigAreasPadrao, criarFiltrosPadrao, type RascunhoVisao } from '@app/shared/models/visao';
import { LATENCIA_MOCK } from './mock/latencia';
import { LocalStorageVisoesRepository } from './local-storage-visoes.repository';

const CHAVE = 'mapa-colaboracao:visoes:v1';

const rascunho = (nome: string): RascunhoVisao => ({
  nome,
  descricao: 'teste',
  tipo: 'areas',
  filtros: criarFiltrosPadrao(),
  config: criarConfigAreasPadrao(),
});

describe('LocalStorageVisoesRepository', () => {
  let repo: LocalStorageVisoesRepository;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: LATENCIA_MOCK, useValue: { min: 0, max: 0 } }, LocalStorageVisoesRepository],
    });
    repo = TestBed.inject(LocalStorageVisoesRepository);
  });

  it('semeia as 3 visões iniciais na primeira leitura e persiste', async () => {
    const visoes = await firstValueFrom(repo.listar());
    expect(visoes.map((v) => v.nome)).toEqual(['Colaboração entre institutos', 'Pontes e centralidade', 'Áreas dominantes']);
    expect(JSON.parse(localStorage.getItem(CHAVE)!)).toHaveLength(3);
  });

  it('cria uma visão com id e datas', async () => {
    const criada = await firstValueFrom(repo.criar(rascunho('Nova')));
    expect(criada.id).toBeTruthy();
    expect(criada.criadoEm).toBe(criada.atualizadoEm);
    expect(await firstValueFrom(repo.listar())).toHaveLength(4);
  });

  it('atualiza preservando id e data de criação', async () => {
    const criada = await firstValueFrom(repo.criar(rascunho('Antes')));
    const atualizada = await firstValueFrom(repo.atualizar(criada.id, rascunho('Depois')));
    expect(atualizada.id).toBe(criada.id);
    expect(atualizada.nome).toBe('Depois');
    expect(atualizada.criadoEm).toBe(criada.criadoEm);
    expect(atualizada.atualizadoEm >= criada.atualizadoEm).toBe(true);
  });

  it('duplica com novo id e sufixo "(cópia)"', async () => {
    const copia = await firstValueFrom(repo.duplicar('visao-areas-dominantes'));
    expect(copia.id).not.toBe('visao-areas-dominantes');
    expect(copia.nome).toBe('Áreas dominantes (cópia)');
    expect(await firstValueFrom(repo.listar())).toHaveLength(4);
  });

  it('exclui uma visão', async () => {
    await firstValueFrom(repo.excluir('visao-areas-dominantes'));
    const ids = (await firstValueFrom(repo.listar())).map((v) => v.id);
    expect(ids).not.toContain('visao-areas-dominantes');
    expect(ids).toHaveLength(2);
  });

  it('emite erro ao obter, atualizar, duplicar ou excluir uma visão inexistente', async () => {
    await expect(firstValueFrom(repo.obter('nao-existe'))).rejects.toThrow('Visão não encontrada.');
    await expect(firstValueFrom(repo.atualizar('nao-existe', rascunho('x')))).rejects.toThrow('Visão não encontrada.');
    await expect(firstValueFrom(repo.duplicar('nao-existe'))).rejects.toThrow('Visão não encontrada.');
    await expect(firstValueFrom(repo.excluir('nao-existe'))).rejects.toThrow('Visão não encontrada.');
  });

  it('reinicia com as visões iniciais quando o armazenamento está corrompido', async () => {
    localStorage.setItem(CHAVE, '{não é json');
    expect(await firstValueFrom(repo.listar())).toHaveLength(3);
  });

  it('guarda uma cópia do valor corrompido antes de reiniciar', async () => {
    localStorage.setItem(CHAVE, '{não é json');
    await firstValueFrom(repo.listar());
    expect(localStorage.getItem(`${CHAVE}:backup`)).toBe('{não é json');
  });

  it('descarta itens com formato inválido sem apagar os válidos', async () => {
    const [valida] = JSON.parse(JSON.stringify(await firstValueFrom(repo.listar()))) as unknown[];
    localStorage.setItem(CHAVE, JSON.stringify([valida, { id: 'x' }, null, 'texto']));
    expect(await firstValueFrom(repo.listar())).toHaveLength(1);
  });

  it('persiste entre instâncias', async () => {
    await firstValueFrom(repo.criar(rascunho('Persistida')));
    const outra = TestBed.runInInjectionContext(() => new LocalStorageVisoesRepository());
    expect((await firstValueFrom(outra.listar())).some((v) => v.nome === 'Persistida')).toBe(true);
  });
});
