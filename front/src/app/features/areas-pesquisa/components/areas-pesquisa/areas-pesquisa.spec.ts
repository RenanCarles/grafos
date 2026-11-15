import { Directive, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgxEchartsDirective } from 'ngx-echarts';
import { of, throwError } from 'rxjs';
import { AREAS_REPOSITORY, type AreasRepository } from '@app/core/repositorios';
import { criarConfigAreasPadrao, criarFiltrosPadrao } from '@app/shared/models/visao';
import { criarDadosAreasFake, provedoresDadosFake } from '@app/shared/testing/fixtures';
import { AreasPesquisa } from './areas-pesquisa';

@Directive({ selector: '[echarts]' })
class EchartsFalso {
  readonly options = input<unknown>();
  readonly autoResize = input<boolean>();
}

describe('AreasPesquisa', () => {
  let fixture: ComponentFixture<AreasPesquisa>;
  const raiz = () => fixture.nativeElement as HTMLElement;

  async function montar(): Promise<void> {
    fixture = TestBed.createComponent(AreasPesquisa);
    fixture.componentRef.setInput('filtros', criarFiltrosPadrao());
    fixture.componentRef.setInput('config', criarConfigAreasPadrao());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AreasPesquisa],
      providers: [...provedoresDadosFake()],
    });
    TestBed.overrideComponent(AreasPesquisa, { set: { providers: [] } });
    TestBed.overrideComponent(AreasPesquisa, {
      remove: { imports: [NgxEchartsDirective] },
      add: { imports: [EchartsFalso] },
    });
    await TestBed.compileComponents();
  });

  it('explica a ausência de áreas e ainda apresenta barras por instituto', async () => {
    const dados = { ...criarDadosAreasFake(), areas: [] };
    vi.spyOn(TestBed.inject(AREAS_REPOSITORY), 'obterAreas').mockReturnValue(of(dados));
    await montar();
    expect(raiz().textContent).toContain('Áreas não disponíveis nesta coleta.');
    fixture.componentRef.setInput('config', {
      ...criarConfigAreasPadrao(),
      agruparPor: 'instituto',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(EchartsFalso))).not.toBeNull();
  });

  it('entrega as opções do gráfico para o ECharts', async () => {
    await montar();
    const diretiva = fixture.debugElement
      .query(By.directive(EchartsFalso))
      .injector.get(EchartsFalso);
    const opcoes = diretiva.options() as { series: { name: string }[] };
    expect(opcoes.series.map((s) => s.name)).toEqual(['Área-ponte', 'Demais áreas']);
  });

  it('mostra a legenda HTML quando há mais de uma série', async () => {
    await montar();
    const legenda = raiz().querySelector('.legenda')?.textContent ?? '';
    expect(legenda).toContain('Área-ponte');
    expect(legenda).toContain('Demais áreas');
  });

  it('alterna para a tabela equivalente', async () => {
    await montar();
    raiz().querySelector<HTMLButtonElement>('mat-button-toggle[value="tabela"] button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const linhas = raiz().querySelectorAll('tbody tr');
    expect(linhas).toHaveLength(3);
    expect(raiz().querySelector('tbody')?.textContent).toContain('Matemática Aplicada');
  });

  it('mostra o erro com opção de tentar novamente', async () => {
    const falho: AreasRepository = {
      obterAreas: () => throwError(() => new Error('Falha ao carregar áreas')),
    };
    TestBed.overrideProvider(AREAS_REPOSITORY, { useValue: falho });
    await montar();
    expect(raiz().textContent).toContain('Falha ao carregar áreas');
    expect(raiz().textContent).toContain('Tentar novamente');
  });

  it('mostra a mensagem de vazio quando nenhuma área tem pesquisadores', async () => {
    const dados = criarDadosAreasFake();
    dados.areas.forEach((area) => (area.pesquisadores = 0));
    const vazio: AreasRepository = { obterAreas: () => of(dados) };
    TestBed.overrideProvider(AREAS_REPOSITORY, { useValue: vazio });
    await montar();
    expect(raiz().textContent).toContain('Nenhuma área com pesquisadores nos filtros atuais.');
  });

  it('recarrega os dados quando os filtros mudam', async () => {
    const obterAreas = vi.fn(() => of(criarDadosAreasFake()));
    TestBed.overrideProvider(AREAS_REPOSITORY, {
      useValue: { obterAreas } satisfies AreasRepository,
    });
    await montar();
    expect(obterAreas).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('filtros', { ...criarFiltrosPadrao(), institutos: ['i1'] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(obterAreas).toHaveBeenCalledTimes(2);
  });
});
