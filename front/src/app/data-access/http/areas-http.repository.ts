import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import type { AreasRepository } from '@app/core/repositorios';
import type { DadosAreas } from '@app/shared/models/dominio';
import type { FiltrosVisao } from '@app/shared/models/visao';
import { parametrosFiltros } from './parametros-filtros';

@Injectable()
export class AreasHttpRepository implements AreasRepository {
  private readonly http = inject(HttpClient);

  obterAreas(filtros: FiltrosVisao) {
    return this.http.get<DadosAreas>('/api/areas', { params: parametrosFiltros(filtros) }).pipe(
      map((dados) => {
        if (!Array.isArray(dados?.areas) || !Array.isArray(dados?.institutos)) {
          throw new Error('Os dados de áreas recebidos da API são inválidos.');
        }
        return dados;
      }),
    );
  }
}
