import { Injectable, inject } from '@angular/core';
import { defer, of, type Observable } from 'rxjs';
import type {
  AreasRepository,
  Catalogo,
  CatalogoRepository,
  RedeRepository,
} from '@app/core/repositorios';
import type { DadosAreas, Rede } from '@app/shared/models/dominio';
import type { FiltrosVisao } from '@app/shared/models/visao';
import { agregarAreas, aplicarFiltros } from './filtros-mock';
import { obterDadosMock } from './gerar-dados';
import { LATENCIA_MOCK, comLatencia } from './latencia';

@Injectable()
export class MockCatalogoRepository implements CatalogoRepository {
  private readonly latencia = inject(LATENCIA_MOCK);

  obterCatalogo(): Observable<Catalogo> {
    return defer(() => {
      const { institutos, areas } = obterDadosMock();
      return of(structuredClone({ institutos, areas }));
    }).pipe(comLatencia(this.latencia));
  }
}

@Injectable()
export class MockRedeRepository implements RedeRepository {
  private readonly latencia = inject(LATENCIA_MOCK);

  obterRede(filtros: FiltrosVisao): Observable<Rede> {
    return defer(() => of(structuredClone(aplicarFiltros(obterDadosMock(), filtros)))).pipe(
      comLatencia(this.latencia),
    );
  }
}

@Injectable()
export class MockAreasRepository implements AreasRepository {
  private readonly latencia = inject(LATENCIA_MOCK);

  obterAreas(filtros: FiltrosVisao): Observable<DadosAreas> {
    return defer(() => of(agregarAreas(obterDadosMock(), filtros))).pipe(comLatencia(this.latencia));
  }
}
