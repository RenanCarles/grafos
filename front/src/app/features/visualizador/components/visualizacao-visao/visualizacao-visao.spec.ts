import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AreasPesquisa } from '@app/features/areas-pesquisa/components/areas-pesquisa/areas-pesquisa';
import { RedeColaboracao } from '@app/features/rede-colaboracao/components/rede-colaboracao/rede-colaboracao';
import type { NoRede } from '@app/shared/models/dominio';
import {
  criarVisaoAreasFake,
  criarVisaoRedeFake,
  provedoresDadosFake,
} from '@app/shared/testing/fixtures';
import { VisualizacaoVisao } from './visualizacao-visao';

@Component({ selector: 'app-rede-colaboracao', template: 'REDE' })
class RedeFalsa {
  readonly filtros = input<unknown>();
  readonly config = input<unknown>();
  readonly noSelecionado = output<NoRede | null>();
}

@Component({ selector: 'app-areas-pesquisa', template: 'AREAS' })
class AreasFalsa {
  readonly filtros = input<unknown>();
  readonly config = input<unknown>();
}

describe('VisualizacaoVisao', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [VisualizacaoVisao],
      providers: provedoresDadosFake(),
    });
    TestBed.overrideComponent(VisualizacaoVisao, {
      remove: { imports: [RedeColaboracao, AreasPesquisa] },
      add: { imports: [RedeFalsa, AreasFalsa] },
    });
    await TestBed.compileComponents();
  });

  it('renderiza o grafo de rede para visões do tipo rede', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    fixture.componentRef.setInput('visao', criarVisaoRedeFake());
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('REDE');
  });

  it('renderiza os gráficos de áreas para visões do tipo áreas', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    fixture.componentRef.setInput('visao', criarVisaoAreasFake());
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('AREAS');
  });
});
