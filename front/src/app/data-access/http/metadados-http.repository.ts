import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import type { MetadadosRepository } from '@app/core/repositorios';
import type { MetadadosColeta } from '@app/shared/models/dominio';
import type { ConfiguracaoPeso } from '@app/shared/models/peso';
import { parametrosPeso } from './parametros-filtros';

@Injectable()
export class MetadadosHttpRepository implements MetadadosRepository {
  private readonly http = inject(HttpClient);

  obterMetadados(configuracao: ConfiguracaoPeso = {}) {
    return this.http
      .get<MetadadosColeta>('/api/meta', { params: parametrosPeso(configuracao) })
      .pipe(
        map((meta) => {
          if (
            typeof meta?.fonteNos !== 'string' ||
            typeof meta?.fonteArestas !== 'string' ||
            typeof meta?.anos !== 'string' ||
            meta?.tipoRelacao !== 'coautoria'
          ) {
            throw new Error(
              'Os metadados recebidos da API são inválidos ou incompatíveis com esta versão.',
            );
          }
          if (configuracao.formulaPeso === 'zanoli' && meta.idFormula !== 'zanoli') {
            throw new Error('A API não confirmou a fórmula Zanoli. Reinicie o backend atualizado.');
          }
          return meta;
        }),
      );
  }
}
