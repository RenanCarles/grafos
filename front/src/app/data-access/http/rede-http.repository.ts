import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import type { RedeRepository } from '@app/core/repositorios';
import type { Rede } from '@app/shared/models/dominio';
import type { FiltrosVisao } from '@app/shared/models/visao';
import { parametrosFiltros } from './parametros-filtros';

@Injectable()
export class RedeHttpRepository implements RedeRepository {
  private readonly http = inject(HttpClient);

  obterRede(filtros: FiltrosVisao) {
    return this.http.get<Rede>('/api/rede', { params: parametrosFiltros(filtros) }).pipe(
      map((rede) => {
        if (!Array.isArray(rede?.nos) || !Array.isArray(rede?.arestas)) {
          throw new Error('A rede recebida da API é inválida.');
        }
        if (filtros.formulaPeso === 'zanoli' && rede.meta?.idFormula !== 'zanoli') {
          throw new Error('A API não confirmou a fórmula Zanoli. Reinicie o backend atualizado.');
        }
        return rede;
      }),
    );
  }
}
