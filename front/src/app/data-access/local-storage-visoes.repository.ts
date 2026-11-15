import { Injectable } from '@angular/core';
import { defer, of, type Observable } from 'rxjs';
import type { VisoesRepository } from '@app/core/repositorios';
import type { RascunhoVisao, Visao } from '@app/shared/models/visao';
import { criarVisoesIniciais } from './visoes-iniciais';

const CHAVE = 'mapa-colaboracao:visoes:reais:v1';
const NAO_ENCONTRADA = 'Visão não encontrada.';

function corrigirNome(visao: Visao): Visao {
  return visao.nome === 'Comuidades' ? { ...visao, nome: 'Comunidades' } : visao;
}

function ehVisaoValida(item: unknown): item is Visao {
  if (typeof item !== 'object' || item === null) return false;
  const visao = item as Partial<Visao>;
  return (
    typeof visao.id === 'string' &&
    (visao.tipo === 'rede' || visao.tipo === 'areas') &&
    typeof visao.config === 'object' &&
    visao.config !== null &&
    typeof visao.filtros === 'object' &&
    visao.filtros !== null
  );
}

@Injectable()
export class LocalStorageVisoesRepository implements VisoesRepository {
  listar(): Observable<Visao[]> {
    return this.executar(() => this.ler());
  }

  obter(id: string): Observable<Visao> {
    return this.executar(() => this.buscar(this.ler(), id));
  }

  criar(rascunho: RascunhoVisao): Observable<Visao> {
    return this.executar(() => {
      const agora = new Date().toISOString();
      const nova: Visao = {
        ...structuredClone(rascunho),
        id: crypto.randomUUID(),
        criadoEm: agora,
        atualizadoEm: agora,
      };
      this.gravar([...this.ler(), nova]);
      return nova;
    });
  }

  atualizar(id: string, rascunho: RascunhoVisao): Observable<Visao> {
    return this.executar(() => {
      const visoes = this.ler();
      const existente = this.buscar(visoes, id);
      const atualizada: Visao = {
        ...structuredClone(rascunho),
        id,
        criadoEm: existente.criadoEm,
        atualizadoEm: new Date().toISOString(),
      };
      this.gravar(visoes.map((v) => (v.id === id ? atualizada : v)));
      return atualizada;
    });
  }

  duplicar(id: string): Observable<Visao> {
    return this.executar(() => {
      const visoes = this.ler();
      const original = this.buscar(visoes, id);
      const agora = new Date().toISOString();
      const copia: Visao = {
        ...structuredClone(original),
        id: crypto.randomUUID(),
        nome: `${original.nome} (cópia)`,
        criadoEm: agora,
        atualizadoEm: agora,
      };
      this.gravar([...visoes, copia]);
      return copia;
    });
  }

  excluir(id: string): Observable<void> {
    return this.executar(() => {
      const visoes = this.ler();
      this.buscar(visoes, id);
      this.gravar(visoes.filter((v) => v.id !== id));
    });
  }

  private executar<T>(operacao: () => T): Observable<T> {
    return defer(() => of(operacao()));
  }

  private buscar(visoes: Visao[], id: string): Visao {
    const visao = visoes.find((v) => v.id === id);
    if (!visao) throw new Error(NAO_ENCONTRADA);
    return visao;
  }

  private ler(): Visao[] {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto === null) return this.reiniciar();
    try {
      const dados: unknown = JSON.parse(bruto);
      if (!Array.isArray(dados)) return this.reiniciar(bruto);
      const lidas = dados.filter(ehVisaoValida);
      const visoes = lidas.map(corrigirNome);
      if (visoes.some((visao, indice) => visao.nome !== lidas[indice].nome)) this.gravar(visoes);
      return visoes;
    } catch {
      return this.reiniciar(bruto);
    }
  }

  private reiniciar(brutoAnterior?: string): Visao[] {
    if (brutoAnterior !== undefined) localStorage.setItem(`${CHAVE}:backup`, brutoAnterior);
    const iniciais = criarVisoesIniciais(new Date().toISOString());
    this.gravar(iniciais);
    return iniciais;
  }

  private gravar(visoes: Visao[]): void {
    localStorage.setItem(CHAVE, JSON.stringify(visoes));
  }
}
