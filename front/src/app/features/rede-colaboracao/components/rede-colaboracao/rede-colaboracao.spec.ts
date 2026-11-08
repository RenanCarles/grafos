import { ComponentFixture, TestBed } from '@angular/core/testing';
import cytoscape, { type Core } from 'cytoscape';
import { of, throwError } from 'rxjs';
import { REDE_REPOSITORY, type RedeRepository } from '@app/core/repositorios';
import type { NoRede } from '@app/shared/models/dominio';
import { criarConfigRedePadrao, criarFiltrosPadrao } from '@app/shared/models/visao';
import { provedoresDadosFake } from '@app/shared/testing/fixtures';
import { FABRICA_CYTOSCAPE, type FabricaCytoscape } from '../../services/fabrica-cytoscape';
import { RedeColaboracao } from './rede-colaboracao';

describe('RedeColaboracao', () => {
  let fixture: ComponentFixture<RedeColaboracao>;
  let instancia: Core | undefined;
  const raiz = () => fixture.nativeElement as HTMLElement;

  const fabricaHeadless: FabricaCytoscape = (opcoes) => {
    instancia = cytoscape({ ...opcoes, container: undefined, headless: true });
    return instancia;
  };

  async function montar(): Promise<void> {
    fixture = TestBed.createComponent(RedeColaboracao);
    fixture.componentRef.setInput('filtros', criarFiltrosPadrao());
    fixture.componentRef.setInput('config', criarConfigRedePadrao());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    instancia = undefined;
    await TestBed.configureTestingModule({
      imports: [RedeColaboracao],
      providers: [...provedoresDadosFake(), { provide: FABRICA_CYTOSCAPE, useValue: fabricaHeadless }],
    }).compileComponents();
  });

  it('cria o grafo com os pesquisadores e as relações', async () => {
    await montar();
    expect(instancia?.nodes()).toHaveLength(5);
    expect(instancia?.edges()).toHaveLength(4);
  });

  it('mostra a legenda por instituto', async () => {
    await montar();
    const legenda = raiz().querySelector('.legenda')?.textContent ?? '';
    expect(legenda).toContain('IESTI');
    expect(legenda).toContain('IEM');
    expect(legenda).toContain('IMC');
  });

  it('emite o pesquisador tocado e null ao tocar no fundo', async () => {
    await montar();
    const emitidos: (NoRede | null)[] = [];
    fixture.componentInstance.noSelecionado.subscribe((no) => emitidos.push(no));
    instancia!.$id('p1').emit('tap');
    instancia!.emit('tap');
    expect(emitidos.map((no) => no?.id ?? null)).toEqual(['p1', null]);
  });

  it('mostra um tooltip ao passar o mouse sobre um pesquisador e some ao sair', async () => {
    await montar();
    instancia!.$id('p1').emit('mouseover');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('[role="tooltip"]')?.textContent).toContain('Ana Souza · 3 parceiros');
    instancia!.$id('p1').emit('mouseout');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('[role="tooltip"]')).toBeNull();
  });

  it('alterna para a tabela equivalente, ordenada por grau', async () => {
    await montar();
    raiz().querySelector<HTMLButtonElement>('mat-button-toggle[value="tabela"] button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const linhas = raiz().querySelectorAll('tbody tr');
    expect(linhas).toHaveLength(5);
    expect(linhas[0].textContent).toContain('Ana Souza');
    expect(raiz().querySelector('.grafo')?.hasAttribute('hidden')).toBe(true);
  });

  it('mostra o erro do repositório com opção de tentar novamente', async () => {
    const falho: RedeRepository = { obterRede: () => throwError(() => new Error('Falha de rede')) };
    TestBed.overrideProvider(REDE_REPOSITORY, { useValue: falho });
    await montar();
    expect(raiz().textContent).toContain('Falha de rede');
    expect(raiz().textContent).toContain('Tentar novamente');
  });

  it('mostra a mensagem de vazio quando os filtros não deixam ninguém', async () => {
    const vazio: RedeRepository = { obterRede: () => of({ nos: [], arestas: [] }) };
    TestBed.overrideProvider(REDE_REPOSITORY, { useValue: vazio });
    await montar();
    expect(raiz().textContent).toContain('Nenhum pesquisador corresponde aos filtros.');
  });
});
