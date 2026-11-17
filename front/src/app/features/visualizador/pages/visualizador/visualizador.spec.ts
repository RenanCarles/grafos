import { Component, input, model, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VISOES_REPOSITORY, type VisoesRepository } from '@app/core/repositorios';
import type { EntradaCardsRede } from '@app/features/rede-colaboracao/services/montar-cards-rede';
import type { NoRede } from '@app/shared/models/dominio';
import {
  criarCatalogoFake,
  criarRedeFake,
  criarVisaoAreasFake,
  criarVisaoRedeFake,
  provedoresDadosFake,
} from '@app/shared/testing/fixtures';
import { VisualizacaoVisao } from '../../components/visualizacao-visao/visualizacao-visao';
import { Visualizador } from './visualizador';

@Component({ selector: 'app-visualizacao-visao', template: 'VISUALIZACAO' })
class VisualizacaoFalsa {
  readonly visao = input<unknown>();
  readonly noSelecionado = output<NoRede | null>();
  readonly grupoSelecionado = model<number | null>(null);
  readonly redeCarregada = output<EntradaCardsRede>();
}

describe('Visualizador', () => {
  let fixture: ComponentFixture<Visualizador>;
  const raiz = () => fixture.nativeElement as HTMLElement;

  const repositorio: Pick<VisoesRepository, 'obter'> = {
    obter: (id: string) => {
      if (id === 'v-rede') return of(criarVisaoRedeFake({ descricao: 'Quem colabora com quem' }));
      if (id === 'v-areas') return of(criarVisaoAreasFake());
      return throwError(() => new Error('Visão não encontrada.'));
    },
  };

  async function abrir(id: string): Promise<void> {
    fixture = TestBed.createComponent(Visualizador);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Visualizador],
      providers: [provideRouter([]), ...provedoresDadosFake(), { provide: VISOES_REPOSITORY, useValue: repositorio }],
    });
    TestBed.overrideComponent(Visualizador, {
      remove: { imports: [VisualizacaoVisao] },
      add: { imports: [VisualizacaoFalsa] },
    });
    await TestBed.compileComponents();
  });

  it('mostra nome, descrição, visualização e o link para editar', async () => {
    await abrir('v-rede');
    expect(raiz().querySelector('h1')?.textContent).toContain('Rede de teste');
    expect(raiz().textContent).toContain('Quem colabora com quem');
    expect(raiz().textContent).toContain('VISUALIZACAO');
    expect(raiz().querySelector('a[href="/visoes/v-rede/editar"]')).not.toBeNull();
  });

  it('atualiza o painel de detalhes quando um pesquisador é selecionado', async () => {
    await abrir('v-rede');
    expect(raiz().textContent).toContain('Selecione um pesquisador no grafo ou na tabela');
    const falsa = fixture.debugElement.query(By.directive(VisualizacaoFalsa)).injector.get(VisualizacaoFalsa);
    falsa.noSelecionado.emit(criarRedeFake().nos[0]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('aside')?.textContent).toContain('Ana Souza');
  });

  it('lista as comunidades em um painel próprio, ao lado dos detalhes do pesquisador', async () => {
    await abrir('v-rede');
    const falsa = fixture.debugElement.query(By.directive(VisualizacaoFalsa)).injector.get(VisualizacaoFalsa);
    falsa.redeCarregada.emit({ rede: criarRedeFake(), catalogo: criarCatalogoFake() });
    await fixture.whenStable();
    fixture.detectChanges();

    const [painelDetalhes, painelComunidades] = Array.from(raiz().querySelectorAll('aside'));
    expect(painelDetalhes.textContent).not.toContain('Comunidades');
    expect(painelComunidades.textContent).toContain('Comunidades');
    expect(painelComunidades.textContent).toContain('Grupo 1 · 2 pessoas');
    const detalhes = painelDetalhes.querySelector('app-painel-pesquisador')!;
    const comunidades = painelComunidades.querySelector('app-painel-comunidades')!;
    expect(detalhes.compareDocumentPosition(comunidades) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('envia ao grafo o grupo escolhido no painel e o marca como selecionado', async () => {
    await abrir('v-rede');
    const falsa = fixture.debugElement.query(By.directive(VisualizacaoFalsa)).injector.get(VisualizacaoFalsa);
    falsa.redeCarregada.emit({ rede: criarRedeFake(), catalogo: criarCatalogoFake() });
    await fixture.whenStable();
    fixture.detectChanges();

    const botoes = raiz().querySelectorAll<HTMLButtonElement>('app-painel-comunidades li button');
    botoes[1].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(falsa.grupoSelecionado()).toBe(1);
    expect(
      raiz().querySelectorAll('app-painel-comunidades li button')[1].getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('não mostra o painel de pesquisador para visões de áreas', async () => {
    await abrir('v-areas');
    expect(raiz().querySelector('aside')).toBeNull();
  });

  it('mostra o erro quando a visão não existe', async () => {
    await abrir('inexistente');
    expect(raiz().textContent).toContain('Visão não encontrada.');
    expect(raiz().textContent).toContain('Tentar novamente');
  });
});
