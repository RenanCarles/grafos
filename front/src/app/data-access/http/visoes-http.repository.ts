import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { concatMap, from, map, of, switchMap, tap, toArray, type Observable } from 'rxjs';
import type { VisoesRepository } from '@app/core/repositorios';
import type { RascunhoVisao, Visao } from '@app/shared/models/visao';

const CHAVE = 'mapa-colaboracao:visoes:reais:v1';
const MARCADOR = 'mapa-colaboracao:visoes:reais:v1:arquivos';

/**
 * Copia uma vez o que o navegador já tinha para os arquivos da API.
 * A chave antiga do protótipo não entra nessa cópia e não é apagada.
 */
@Injectable()
export class VisoesHttpRepository implements VisoesRepository {
  private readonly http = inject(HttpClient);

  listar(): Observable<Visao[]> {
    if (copiada()) return this.buscarLista();
    return this.buscarLista().pipe(
      switchMap((atuais) => {
        const faltantes = faltantesNoNavegador(atuais);
        if (faltantes.length === 0) {
          marcarCopiada();
          return of(atuais);
        }
        return this.enviar(faltantes).pipe(
          switchMap(() => this.buscarLista()),
          tap(() => marcarCopiada()),
        );
      }),
    );
  }

  obter(id: string): Observable<Visao> {
    return this.comArquivos(() => this.buscarUma(id));
  }

  criar(rascunho: RascunhoVisao): Observable<Visao> {
    return this.comArquivos(() =>
      this.http.post<unknown>('/api/visoes', rascunho).pipe(map(validarUma)),
    );
  }

  atualizar(id: string, rascunho: RascunhoVisao): Observable<Visao> {
    return this.comArquivos(() =>
      this.http.put<unknown>(caminho(id), rascunho).pipe(map(validarUma)),
    );
  }

  duplicar(id: string): Observable<Visao> {
    return this.comArquivos(() =>
      this.http.post<unknown>(`${caminho(id)}/duplicar`, {}).pipe(map(validarUma)),
    );
  }

  excluir(id: string): Observable<void> {
    return this.comArquivos(() => this.http.delete<void>(caminho(id)));
  }

  private comArquivos<T>(operacao: () => Observable<T>): Observable<T> {
    return copiada() ? operacao() : this.listar().pipe(switchMap(() => operacao()));
  }

  private buscarLista(): Observable<Visao[]> {
    return this.http.get<unknown>('/api/visoes').pipe(map(validarLista));
  }

  private buscarUma(id: string): Observable<Visao> {
    return this.http.get<unknown>(caminho(id)).pipe(map(validarUma));
  }

  private enviar(visoes: Visao[]): Observable<Visao[]> {
    return from(visoes).pipe(
      concatMap((visao) =>
        this.http.post<unknown>('/api/visoes/importar', visao).pipe(map(validarUma)),
      ),
      toArray(),
    );
  }
}

function caminho(id: string): string {
  return `/api/visoes/${encodeURIComponent(id)}`;
}

function copiada(): boolean {
  return localStorage.getItem(MARCADOR) === '1';
}

function marcarCopiada(): void {
  localStorage.setItem(MARCADOR, '1');
}

function faltantesNoNavegador(atuais: Visao[]): Visao[] {
  const ids = new Set(atuais.map((visao) => visao.id));
  return lerNavegador()
    .filter((visao) => !ids.has(visao.id))
    .map(corrigirNome);
}

function lerNavegador(): Visao[] {
  const bruto = localStorage.getItem(CHAVE);
  if (bruto === null) return [];
  try {
    const dados: unknown = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];
    return dados.filter(ehImportavel);
  } catch {
    return [];
  }
}

function corrigirNome(visao: Visao): Visao {
  return visao.nome === 'Comuidades' ? { ...visao, nome: 'Comunidades' } : visao;
}

function validarLista(dados: unknown): Visao[] {
  if (!Array.isArray(dados) || dados.some((item) => !ehVisao(item))) {
    throw new Error('A lista de visões recebida da API é inválida.');
  }
  return dados;
}

function validarUma(dados: unknown): Visao {
  if (!ehVisao(dados)) throw new Error('A visão recebida da API é inválida.');
  return dados;
}

function ehVisao(item: unknown): item is Visao {
  if (!ehImportavel(item)) return false;
  const visao = item as Visao;
  return (
    typeof visao.descricao === 'string' &&
    typeof visao.criadoEm === 'string' &&
    typeof visao.atualizadoEm === 'string'
  );
}

function ehImportavel(item: unknown): item is Visao {
  if (typeof item !== 'object' || item === null) return false;
  const visao = item as Partial<Visao>;
  return (
    typeof visao.id === 'string' &&
    typeof visao.nome === 'string' &&
    (visao.tipo === 'rede' || visao.tipo === 'areas') &&
    typeof visao.config === 'object' &&
    visao.config !== null &&
    typeof visao.filtros === 'object' &&
    visao.filtros !== null
  );
}
