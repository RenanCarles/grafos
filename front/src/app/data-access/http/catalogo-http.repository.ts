import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import type { Catalogo, CatalogoRepository } from '@app/core/repositorios';

@Injectable()
export class CatalogoHttpRepository implements CatalogoRepository {
  private readonly http = inject(HttpClient);

  obterCatalogo() {
    return this.http.get<Catalogo>('/api/catalogo').pipe(
      map((catalogo) => {
        if (!Array.isArray(catalogo?.institutos) || !Array.isArray(catalogo?.areas)) {
          throw new Error('O catálogo recebido da API é inválido.');
        }
        return catalogo;
      }),
    );
  }
}
