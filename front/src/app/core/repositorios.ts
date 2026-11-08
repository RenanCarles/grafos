import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Area, DadosAreas, Instituto, Rede } from '@app/shared/models/dominio';
import type { FiltrosVisao, RascunhoVisao, Visao } from '@app/shared/models/visao';

export interface Catalogo {
  institutos: Instituto[];
  areas: Area[];
}

export interface CatalogoRepository {
  obterCatalogo(): Observable<Catalogo>;
}

export interface RedeRepository {
  obterRede(filtros: FiltrosVisao): Observable<Rede>;
}

export interface AreasRepository {
  obterAreas(filtros: FiltrosVisao): Observable<DadosAreas>;
}

export interface VisoesRepository {
  listar(): Observable<Visao[]>;
  /** Emite erro se a visão não existir. */
  obter(id: string): Observable<Visao>;
  criar(rascunho: RascunhoVisao): Observable<Visao>;
  atualizar(id: string, rascunho: RascunhoVisao): Observable<Visao>;
  duplicar(id: string): Observable<Visao>;
  excluir(id: string): Observable<void>;
}

export const CATALOGO_REPOSITORY = new InjectionToken<CatalogoRepository>('CATALOGO_REPOSITORY');
export const REDE_REPOSITORY = new InjectionToken<RedeRepository>('REDE_REPOSITORY');
export const AREAS_REPOSITORY = new InjectionToken<AreasRepository>('AREAS_REPOSITORY');
export const VISOES_REPOSITORY = new InjectionToken<VisoesRepository>('VISOES_REPOSITORY');
