import type { Provider } from '@angular/core';
import {
  AREAS_REPOSITORY,
  CATALOGO_REPOSITORY,
  REDE_REPOSITORY,
  VISOES_REPOSITORY,
} from '@app/core/repositorios';
import { LocalStorageVisoesRepository } from './local-storage-visoes.repository';
import { MockAreasRepository, MockCatalogoRepository, MockRedeRepository } from './mock/repositorios-mock';

export function provideDados(): Provider[] {
  return [
    { provide: CATALOGO_REPOSITORY, useClass: MockCatalogoRepository },
    { provide: REDE_REPOSITORY, useClass: MockRedeRepository },
    { provide: AREAS_REPOSITORY, useClass: MockAreasRepository },
    { provide: VISOES_REPOSITORY, useClass: LocalStorageVisoesRepository },
  ];
}
