import { Component, input, model, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AreasPesquisa } from '@app/features/areas-pesquisa/components/areas-pesquisa/areas-pesquisa';
import { RedeColaboracao } from '@app/features/rede-colaboracao/components/rede-colaboracao/rede-colaboracao';
import type { EntradaCardsRede } from '@app/features/rede-colaboracao/services/montar-cards-rede';
import type { DadosAreas, NoRede } from '@app/shared/models/dominio';
import {
  criarCatalogoFake,
  criarDadosAreasFake,
  criarRedeFake,
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
  readonly grupoSelecionado = model<number | null>(null);
  readonly dadosCarregados = output<EntradaCardsRede>();
}

@Component({ selector: 'app-areas-pesquisa', template: 'AREAS' })
class AreasFalsa {
  readonly filtros = input<unknown>();
  readonly config = input<unknown>();
  readonly dadosCarregados = output<DadosAreas>();
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

  it('só mostra o carrossel depois que a rede carrega', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    fixture.componentRef.setInput('visao', criarVisaoRedeFake());
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-carrossel-metricas section'),
    ).toBeNull();

    fixture.debugElement.query(By.directive(RedeFalsa)).componentInstance.dadosCarregados.emit({
      rede: criarRedeFake(),
      catalogo: criarCatalogoFake(),
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Visão geral');
    expect(texto).toContain('Mais parceiros');
  });

  it('mostra o carrossel de áreas quando os dados chegam', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    fixture.componentRef.setInput('visao', criarVisaoAreasFake());
    fixture.detectChanges();

    fixture.debugElement
      .query(By.directive(AreasFalsa))
      .componentInstance.dadosCarregados.emit(criarDadosAreasFake());
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Áreas com pesquisadores');
  });

  it('esconde o carrossel quando mostrarMetricas é falso', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    fixture.componentRef.setInput('visao', criarVisaoRedeFake());
    fixture.componentRef.setInput('mostrarMetricas', false);
    fixture.detectChanges();

    fixture.debugElement.query(By.directive(RedeFalsa)).componentInstance.dadosCarregados.emit({
      rede: criarRedeFake(),
      catalogo: criarCatalogoFake(),
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Visão geral');
  });

  it('repassa a rede carregada para quem escuta', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    const recebidas: EntradaCardsRede[] = [];
    fixture.componentInstance.redeCarregada.subscribe((entrada) => recebidas.push(entrada));
    fixture.componentRef.setInput('visao', criarVisaoRedeFake());
    fixture.detectChanges();

    const entrada = { rede: criarRedeFake(), catalogo: criarCatalogoFake() };
    fixture.debugElement
      .query(By.directive(RedeFalsa))
      .componentInstance.dadosCarregados.emit(entrada);

    expect(recebidas).toEqual([entrada]);
  });

  it('liga o grupo selecionado nos dois sentidos com o grafo', () => {
    const fixture = TestBed.createComponent(VisualizacaoVisao);
    fixture.componentRef.setInput('visao', criarVisaoRedeFake());
    fixture.componentRef.setInput('grupoSelecionado', 2);
    fixture.detectChanges();
    const rede = fixture.debugElement.query(By.directive(RedeFalsa)).componentInstance as RedeFalsa;
    expect(rede.grupoSelecionado()).toBe(2);

    rede.grupoSelecionado.set(5);
    fixture.detectChanges();
    expect(fixture.componentInstance.grupoSelecionado()).toBe(5);
  });
});
