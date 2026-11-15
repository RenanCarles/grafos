import type { Provider } from '@angular/core';
import {
  AREAS_REPOSITORY,
  CATALOGO_REPOSITORY,
  REDE_REPOSITORY,
  VISOES_REPOSITORY,
  METADADOS_REPOSITORY,
} from '@app/core/repositorios';
import { AreasHttpRepository } from './http/areas-http.repository';
import { CatalogoHttpRepository } from './http/catalogo-http.repository';
import { MetadadosHttpRepository } from './http/metadados-http.repository';
import { RedeHttpRepository } from './http/rede-http.repository';
import { VisoesHttpRepository } from './http/visoes-http.repository';

export function provideDados(): Provider[] {
  return [
    { provide: CATALOGO_REPOSITORY, useClass: CatalogoHttpRepository },
    { provide: REDE_REPOSITORY, useClass: RedeHttpRepository },
    { provide: AREAS_REPOSITORY, useClass: AreasHttpRepository },
    { provide: METADADOS_REPOSITORY, useClass: MetadadosHttpRepository },
    { provide: VISOES_REPOSITORY, useClass: VisoesHttpRepository },
  ];
}
