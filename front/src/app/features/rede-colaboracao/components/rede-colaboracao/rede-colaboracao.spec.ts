import { ComponentFixture, TestBed } from '@angular/core/testing';
import cytoscape, { type Core } from 'cytoscape';
import { of, throwError } from 'rxjs';
import { REDE_REPOSITORY, type RedeRepository } from '@app/core/repositorios';
import type { NoRede } from '@app/shared/models/dominio';
import { criarConfigRedePadrao, criarFiltrosPadrao } from '@app/shared/models/visao';
import { criarRedeFake, provedoresDadosFake } from '@app/shared/testing/fixtures';
import { FABRICA_CYTOSCAPE, type FabricaCytoscape } from '../../services/fabrica-cytoscape';
import type { EntradaCardsRede } from '../../services/montar-cards-rede';
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
      providers: [
        ...provedoresDadosFake(),
        { provide: FABRICA_CYTOSCAPE, useValue: fabricaHeadless },
      ],
    }).compileComponents();
  });

  it('cria o grafo com os pesquisadores e as relações', async () => {
    await montar();
    expect(instancia?.nodes()).toHaveLength(5);
    expect(instancia?.edges()).toHaveLength(2);
  });

  it('emite a rede e o catálogo carregados', async () => {
    fixture = TestBed.createComponent(RedeColaboracao);
    const emitidos: EntradaCardsRede[] = [];
    fixture.componentInstance.dadosCarregados.subscribe((entrada) => emitidos.push(entrada));
    fixture.componentRef.setInput('filtros', criarFiltrosPadrao());
    fixture.componentRef.setInput('config', criarConfigRedePadrao());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(emitidos.length).toBeGreaterThan(0);
    expect(emitidos.at(-1)?.rede.nos).toHaveLength(5);
    expect(emitidos.at(-1)?.catalogo.institutos).toHaveLength(3);
  });

  it('mostra a legenda por instituto', async () => {
    await montar();
    const legenda = raiz().querySelector('.legenda')?.textContent ?? '';
    expect(legenda).toContain('IESTI');
    expect(legenda).toContain('IEM');
    expect(legenda).toContain('IMC');
  });

  it('apresenta o peso de uma aresta no tooltip', async () => {
    await montar();
    const aresta = instancia!.edges().first();
    aresta.emit('mouseover');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('[role="tooltip"]')?.textContent).toContain(
      `Peso: ${aresta.data('peso')}`,
    );
    aresta.emit('mouseout');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('[role="tooltip"]')).toBeNull();
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
    expect(raiz().querySelector('[role="tooltip"]')?.textContent).toContain(
      'Ana Souza · IESTI · Grupo 1 · 3 parceiros',
    );
    instancia!.$id('p1').emit('mouseout');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('[role="tooltip"]')).toBeNull();
  });

  it('mostra quem é o vértice clicado e destaca a vizinhança', async () => {
    await montar();
    instancia!.$id('p1').emit('tap');
    await fixture.whenStable();
    fixture.detectChanges();
    const ficha = raiz().querySelector('.ficha')?.textContent ?? '';
    expect(ficha).toContain('Ana Souza');
    expect(ficha).toContain('Sistemas e Tecnologia da Informação');
    expect(ficha).toContain('1 de 3');
    expect(ficha).toContain('Louvain');
    expect(instancia!.$id('p1').hasClass('destaque')).toBe(true);
    expect(instancia!.$id('p2').hasClass('apagado')).toBe(false);
    expect(instancia!.$id('p5').hasClass('apagado')).toBe(true);
  });

  it('explica a comunidade clicada e destaca os membros do grupo', async () => {
    await montar();
    fixture.componentRef.setInput('grupoSelecionado', 0);
    await fixture.whenStable();
    fixture.detectChanges();
    const ficha = raiz().querySelector('.ficha')?.textContent ?? '';
    expect(ficha).toContain('2 pessoas neste recorte');
    expect(ficha).toContain('Institutos na rede completa: IESTI');
    expect(ficha).toContain('Louvain');
    expect(instancia!.$id('p1').hasClass('destaque')).toBe(true);
    expect(instancia!.$id('p2').hasClass('destaque')).toBe(true);
    expect(instancia!.$id('p3').hasClass('apagado')).toBe(true);
  });

  it('limpa o grupo selecionado ao tocar num pesquisador', async () => {
    await montar();
    fixture.componentRef.setInput('grupoSelecionado', 0);
    await fixture.whenStable();
    fixture.detectChanges();
    instancia!.$id('p3').emit('tap');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.grupoSelecionado()).toBeNull();
    expect(raiz().querySelector('.ficha')?.textContent).toContain('Carla Dias');
  });

  it('informa o grupo aberto pelo botão da ficha do pesquisador', async () => {
    await montar();
    instancia!.$id('p1').emit('tap');
    await fixture.whenStable();
    fixture.detectChanges();
    const abrir = [...raiz().querySelectorAll('.ficha button')].find((botao) =>
      botao.textContent?.includes('Ver o grupo 1'),
    ) as HTMLButtonElement;
    abrir.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.grupoSelecionado()).toBe(0);
    expect(instancia!.$id('p2').hasClass('destaque')).toBe(true);
  });

  it('avisa que nenhum pesquisador está selecionado quando um grupo é escolhido de fora', async () => {
    await montar();
    const emitidos: (NoRede | null)[] = [];
    fixture.componentInstance.noSelecionado.subscribe((no) => emitidos.push(no));
    fixture.componentRef.setInput('grupoSelecionado', 1);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(emitidos).toContain(null);
  });

  it('fecha a ficha ao clicar no fundo do grafo', async () => {
    await montar();
    instancia!.$id('p1').emit('tap');
    await fixture.whenStable();
    fixture.detectChanges();
    instancia!.emit('tap');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz().querySelector('.ficha')).toBeNull();
    expect(instancia!.$id('p1').hasClass('destaque')).toBe(false);
  });

  it('alterna para a tabela equivalente, ordenada por grau', async () => {
    await montar();
    raiz().querySelector<HTMLButtonElement>('mat-button-toggle[value="tabela"] button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const linhas = raiz().querySelectorAll('tbody tr');
    expect(linhas).toHaveLength(5);
    expect(linhas[0].textContent).toContain('Ana Souza');
    expect(linhas[0].textContent).toContain('IESTI');
    expect(raiz().textContent).toContain('1 deles reúne institutos diferentes');
    expect(raiz().querySelector('.grafo')?.hasAttribute('hidden')).toBe(true);
  });

  it('ordena a tabela pela força ao clicar no cabeçalho', async () => {
    const rede = criarRedeFake();
    rede.nos[0].forca = 1;
    rede.nos[1].forca = 9;
    rede.nos[2].forca = 4;
    rede.nos[3].forca = 0;
    rede.nos[4].forca = 0;
    const repositorio: RedeRepository = { obterRede: () => of(rede) };
    TestBed.overrideProvider(REDE_REPOSITORY, { useValue: repositorio });
    await montar();
    raiz().querySelector<HTMLButtonElement>('mat-button-toggle[value="tabela"] button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const botaoForca = [...raiz().querySelectorAll('thead button')].find((botao) =>
      botao.textContent?.includes('Força'),
    ) as HTMLButtonElement;
    botaoForca.click();
    fixture.detectChanges();
    const linhas = raiz().querySelectorAll('tbody tr');
    expect(linhas[0].textContent).toContain('Bruno Lima');
    expect(linhas[1].textContent).toContain('Carla Dias');
    expect(botaoForca.closest('th')?.getAttribute('aria-sort')).toBe('descending');
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
