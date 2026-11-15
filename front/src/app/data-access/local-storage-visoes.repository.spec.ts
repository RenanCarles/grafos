import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  criarConfigAreasPadrao,
  criarFiltrosPadrao,
  type RascunhoVisao,
} from '@app/shared/models/visao';
import { LocalStorageVisoesRepository } from './local-storage-visoes.repository';

const CHAVE = 'mapa-colaboracao:visoes:reais:v1';

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
      providers: [LocalStorageVisoesRepository],
    });
    repo = TestBed.inject(LocalStorageVisoesRepository);
  });

  it('semeia as 2 visões reais na primeira leitura e persiste', async () => {
    const visoes = await firstValueFrom(repo.listar());
    expect(visoes.map((v) => v.nome)).toEqual([
      'Colaboração entre institutos',
      'Pontes e centralidade',
    ]);
    expect(JSON.parse(localStorage.getItem(CHAVE)!)).toHaveLength(2);
  });

  it('cria uma visão com id e datas', async () => {
    const criada = await firstValueFrom(repo.criar(rascunho('Nova')));
    expect(criada.id).toBeTruthy();
    expect(criada.criadoEm).toBe(criada.atualizadoEm);
    expect(await firstValueFrom(repo.listar())).toHaveLength(3);
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
    const copia = await firstValueFrom(repo.duplicar('visao-pontes-centralidade'));
    expect(copia.id).not.toBe('visao-pontes-centralidade');
    expect(copia.nome).toBe('Pontes e centralidade (cópia)');
    expect(await firstValueFrom(repo.listar())).toHaveLength(3);
  });

  it('exclui uma visão', async () => {
    await firstValueFrom(repo.excluir('visao-pontes-centralidade'));
    const ids = (await firstValueFrom(repo.listar())).map((v) => v.id);
    expect(ids).not.toContain('visao-pontes-centralidade');
    expect(ids).toHaveLength(1);
  });

  it('emite erro ao obter, atualizar, duplicar ou excluir uma visão inexistente', async () => {
    await expect(firstValueFrom(repo.obter('nao-existe'))).rejects.toThrow('Visão não encontrada.');
    await expect(firstValueFrom(repo.atualizar('nao-existe', rascunho('x')))).rejects.toThrow(
      'Visão não encontrada.',
    );
    await expect(firstValueFrom(repo.duplicar('nao-existe'))).rejects.toThrow(
      'Visão não encontrada.',
    );
    await expect(firstValueFrom(repo.excluir('nao-existe'))).rejects.toThrow(
      'Visão não encontrada.',
    );
  });

  it('reinicia com as visões iniciais quando o armazenamento está corrompido', async () => {
    localStorage.setItem(CHAVE, '{não é json');
    expect(await firstValueFrom(repo.listar())).toHaveLength(2);
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

  it('corrige o nome salvo Comuidades para Comunidades', async () => {
    const [visao] = await firstValueFrom(repo.listar());
    localStorage.setItem(CHAVE, JSON.stringify([{ ...visao, nome: 'Comuidades' }]));
    const lidas = await firstValueFrom(repo.listar());
    expect(lidas[0].nome).toBe('Comunidades');
    expect(JSON.parse(localStorage.getItem(CHAVE)!)[0].nome).toBe('Comunidades');
  });

  it('persiste entre instâncias', async () => {
    await firstValueFrom(repo.criar(rascunho('Persistida')));
    const outra = TestBed.runInInjectionContext(() => new LocalStorageVisoesRepository());
    expect((await firstValueFrom(outra.listar())).some((v) => v.nome === 'Persistida')).toBe(true);
  });

  it('preserva a fórmula e os parâmetros escolhidos ao salvar e reabrir', async () => {
    const entrada = rascunho('Zanoli');
    entrada.filtros = {
      ...entrada.filtros,
      formulaPeso: 'zanoli',
      lambdaTemporal: 0.2,
      anoReferencia: 2027,
    };
    const criada = await firstValueFrom(repo.criar(entrada));
    expect((await firstValueFrom(repo.obter(criada.id))).filtros).toEqual(entrada.filtros);
  });

  it('preserva as visões antigas do protótipo sem reutilizar filtros simulados', async () => {
    const antigo = JSON.stringify([{ id: 'mock', filtros: { pesoMinimo: 1 } }]);
    localStorage.setItem('mapa-colaboracao:visoes:v1', antigo);
    const atuais = await firstValueFrom(repo.listar());
    expect(atuais).toHaveLength(2);
    expect(atuais.every((v) => v.filtros.pesoMinimo === 0)).toBe(true);
    expect(localStorage.getItem('mapa-colaboracao:visoes:v1')).toBe(antigo);
  });
});
