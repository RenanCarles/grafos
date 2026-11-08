import { TestBed } from '@angular/core/testing';
import { VISOES_REPOSITORY } from '@app/core/repositorios';
import { RepositorioVisoesFake } from '../testing/repositorio-visoes-fake';
import { VisoesStore } from './visoes.store';

describe('VisoesStore', () => {
  let repo: RepositorioVisoesFake;
  let store: VisoesStore;

  beforeEach(() => {
    repo = new RepositorioVisoesFake();
    TestBed.configureTestingModule({ providers: [{ provide: VISOES_REPOSITORY, useValue: repo }] });
    store = TestBed.inject(VisoesStore);
  });

  it('começa em carregando, sem visões', () => {
    expect(store.estado()).toBe('carregando');
    expect(store.visoes()).toEqual([]);
  });

  it('carrega as visões e fica pronto', async () => {
    await store.carregar();
    expect(store.estado()).toBe('pronto');
    expect(store.visoes().map((v) => v.id)).toEqual(['a', 'b']);
  });

  it('vai para erro com a mensagem quando a listagem falha', async () => {
    repo.falharListagem = true;
    await store.carregar();
    expect(store.estado()).toBe('erro');
    expect(store.mensagemErro()).toBe('Falha ao listar');
  });

  it('marca recarregando apenas quando já havia dados na tela', async () => {
    await store.carregar();
    const segunda = store.carregar();
    expect(store.recarregando()).toBe(true);
    await segunda;
    expect(store.recarregando()).toBe(false);
    expect(store.estado()).toBe('pronto');
  });

  it('exclui e recarrega a lista', async () => {
    await store.carregar();
    await store.excluir('a');
    expect(store.visoes().map((v) => v.id)).toEqual(['b']);
  });

  it('duplica, recarrega e devolve a cópia', async () => {
    await store.carregar();
    const copia = await store.duplicar('a');
    expect(copia.nome).toBe('A (cópia)');
    expect(store.visoes()).toHaveLength(3);
  });
});
