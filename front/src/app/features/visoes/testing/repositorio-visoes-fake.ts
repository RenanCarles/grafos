import { of, throwError, type Observable } from 'rxjs';
import type { VisoesRepository } from '@app/core/repositorios';
import { criarVisaoAreasFake, criarVisaoRedeFake } from '@app/shared/testing/fixtures';
import type { RascunhoVisao, Visao } from '@app/shared/models/visao';

const AGORA = '2026-03-01T12:00:00.000Z';

export class RepositorioVisoesFake implements VisoesRepository {
  visoes: Visao[] = [
    criarVisaoRedeFake({ id: 'a', nome: 'A' }),
    criarVisaoAreasFake({ id: 'b', nome: 'B' }),
  ];
  falharListagem = false;

  listar(): Observable<Visao[]> {
    return this.falharListagem
      ? throwError(() => new Error('Falha ao listar'))
      : of(structuredClone(this.visoes));
  }

  obter(id: string): Observable<Visao> {
    const visao = this.visoes.find((v) => v.id === id);
    return visao ? of(structuredClone(visao)) : throwError(() => new Error('Visão não encontrada.'));
  }

  criar(rascunho: RascunhoVisao): Observable<Visao> {
    const visao = { ...structuredClone(rascunho), id: 'novo', criadoEm: AGORA, atualizadoEm: AGORA } as Visao;
    this.visoes.push(visao);
    return of(visao);
  }

  atualizar(id: string, rascunho: RascunhoVisao): Observable<Visao> {
    const atual = this.visoes.find((v) => v.id === id);
    if (!atual) return throwError(() => new Error('Visão não encontrada.'));
    const visao = { ...structuredClone(rascunho), id, criadoEm: atual.criadoEm, atualizadoEm: AGORA } as Visao;
    this.visoes = this.visoes.map((v) => (v.id === id ? visao : v));
    return of(visao);
  }

  duplicar(id: string): Observable<Visao> {
    const original = this.visoes.find((v) => v.id === id);
    if (!original) return throwError(() => new Error('Visão não encontrada.'));
    const copia: Visao = { ...structuredClone(original), id: `${id}-copia`, nome: `${original.nome} (cópia)` };
    this.visoes.push(copia);
    return of(copia);
  }

  excluir(id: string): Observable<void> {
    this.visoes = this.visoes.filter((v) => v.id !== id);
    return of(undefined);
  }
}
