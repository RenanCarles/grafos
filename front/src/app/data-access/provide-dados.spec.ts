import { TestBed } from '@angular/core/testing';
import {
  AREAS_REPOSITORY,
  CATALOGO_REPOSITORY,
  REDE_REPOSITORY,
  VISOES_REPOSITORY,
} from '@app/core/repositorios';
import { provideDados } from './provide-dados';

describe('provideDados', () => {
  it('registra os quatro repositórios', () => {
    TestBed.configureTestingModule({ providers: [provideDados()] });
    expect(TestBed.inject(CATALOGO_REPOSITORY).obterCatalogo).toBeTypeOf('function');
    expect(TestBed.inject(REDE_REPOSITORY).obterRede).toBeTypeOf('function');
    expect(TestBed.inject(AREAS_REPOSITORY).obterAreas).toBeTypeOf('function');
    expect(TestBed.inject(VISOES_REPOSITORY).listar).toBeTypeOf('function');
  });
});
