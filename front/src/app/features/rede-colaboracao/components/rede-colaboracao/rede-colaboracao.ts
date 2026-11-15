import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import type { Core, EventObject, NodeSingular } from 'cytoscape';
import { CATALOGO_REPOSITORY, REDE_REPOSITORY } from '@app/core/repositorios';
import { TemaService } from '@app/core/tema.service';
import { EstadoPagina, type EstadoCarga } from '@app/shared/components/estado-pagina';
import type { NoRede, Rede } from '@app/shared/models/dominio';
import type { ConfigRede, FiltrosVisao } from '@app/shared/models/visao';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';
import { valorDe } from '@app/shared/util/recurso';
import { SLOTS_REDE } from '@app/shared/viz/paleta';
import { FABRICA_CYTOSCAPE } from '../../services/fabrica-cytoscape';
import {
  montarModeloRede,
  type ItemLegenda,
  type LinhaRede,
  type ModeloRede,
} from '../../services/montar-modelo-rede';
import {
  descreverGrupo,
  resumirComunidades,
  SIGNIFICADO_COMUNIDADE,
  type ResumoComunidade,
} from '../../services/resumir-comunidades';

type FocoGrafo =
  | { tipo: 'pessoa'; id: string }
  | { tipo: 'comunidade'; indice: number }
  | { tipo: 'instituto'; id: string }
  | { tipo: 'outros' };

const COLUNAS_TABELA = [
  { id: 'nome', rotulo: 'Pesquisador', numerica: false, titulo: null },
  { id: 'instituto', rotulo: 'Instituto', numerica: false, titulo: null },
  { id: 'areas', rotulo: 'Áreas', numerica: false, titulo: null },
  { id: 'grau', rotulo: 'Grau', numerica: true, titulo: null },
  { id: 'forca', rotulo: 'Força', numerica: true, titulo: null },
  { id: 'intermediacao', rotulo: 'Intermediação', numerica: true, titulo: null },
  { id: 'grupo', rotulo: 'Grupo', numerica: true, titulo: null },
  {
    id: 'vizinhosFora',
    rotulo: 'Fora',
    numerica: true,
    titulo: 'Parceiros em outro instituto',
  },
  { id: 'institutosDoGrupo', rotulo: 'Institutos do grupo', numerica: false, titulo: null },
] as const;

type ColunaTabela = (typeof COLUNAS_TABELA)[number]['id'];

function compararLinhas(a: LinhaRede, b: LinhaRede, coluna: ColunaTabela): number {
  const esquerda = a[coluna];
  const direita = b[coluna];
  if (esquerda === null || direita === null) {
    if (esquerda === direita) return 0;
    return esquerda === null ? -1 : 1;
  }
  if (typeof esquerda === 'number' && typeof direita === 'number') return esquerda - direita;
  return String(esquerda).localeCompare(String(direita), 'pt-BR');
}

@Component({
  selector: 'app-rede-colaboracao',
  imports: [MatButtonToggleModule, EstadoPagina],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rede-colaboracao.html',
  styleUrl: './rede-colaboracao.scss',
})
export class RedeColaboracao {
  readonly filtros = input.required<FiltrosVisao>();
  readonly config = input.required<ConfigRede>();
  readonly noSelecionado = output<NoRede | null>();

  private readonly redeRepositorio = inject(REDE_REPOSITORY);
  private readonly catalogoRepositorio = inject(CATALOGO_REPOSITORY);
  private readonly criarGrafo = inject(FABRICA_CYTOSCAPE);
  private readonly tema = inject(TemaService);
  private readonly destruicao = inject(DestroyRef);

  private readonly host = viewChild<ElementRef<HTMLElement>>('grafo');
  private grafo?: Core;
  private observador?: ResizeObserver;
  private quadro = 0;
  private tamanhoAjustado = '';

  protected readonly exibicao = signal<'grafico' | 'tabela'>('grafico');
  protected readonly tooltip = signal<{ x: number; y: number; texto: string } | null>(null);
  protected readonly colunas = COLUNAS_TABELA;
  protected readonly significadoComunidade = SIGNIFICADO_COMUNIDADE;
  protected readonly ordenacao = signal<{ coluna: ColunaTabela; direcao: 'asc' | 'desc' }>({
    coluna: 'grau',
    direcao: 'desc',
  });
  protected readonly foco = signal<FocoGrafo | null>(null);

  private readonly filtrosEstaveis = computed(() => this.filtros(), {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });

  private readonly redeRecurso = rxResource({
    params: () => this.filtrosEstaveis(),
    stream: ({ params }) => this.redeRepositorio.obterRede(params),
  });
  private readonly catalogoRecurso = rxResource({
    stream: () => this.catalogoRepositorio.obterCatalogo(),
  });

  private readonly ultimaRede = linkedSignal<Rede | undefined, Rede | undefined>({
    source: () => valorDe(this.redeRecurso),
    computation: (atual, anterior) => atual ?? anterior?.value,
  });

  protected readonly erro = computed(
    () => this.redeRecurso.error() ?? this.catalogoRecurso.error(),
  );
  protected readonly mensagemErro = computed(() => mensagemDe(this.erro()));
  protected readonly estado = computed<EstadoCarga>(() => {
    if (this.erro()) return 'erro';
    return this.ultimaRede() && this.catalogoRecurso.hasValue() ? 'pronto' : 'carregando';
  });
  protected readonly recarregando = computed(
    () => this.redeRecurso.isLoading() && this.ultimaRede() !== undefined,
  );
  protected readonly vazio = computed(() => this.ultimaRede()?.nos.length === 0);
  protected readonly totalPesquisadores = computed(() => this.ultimaRede()?.nos.length ?? 0);
  protected readonly totalPares = computed(
    () => this.modelo()?.elementos.filter((e) => e.group === 'edges').length ?? 0,
  );
  protected readonly mostrarEstado = computed(() => this.estado() !== 'pronto' || this.vazio());

  protected readonly modelo = computed<ModeloRede | null>(() => {
    const rede = this.ultimaRede();
    const catalogo = valorDe(this.catalogoRecurso);
    return rede && catalogo
      ? montarModeloRede({ rede, catalogo, config: this.config(), modo: this.tema.modo() })
      : null;
  });

  protected readonly linhas = computed(() => {
    const linhas = this.modelo()?.linhas ?? [];
    const { coluna, direcao } = this.ordenacao();
    const fator = direcao === 'asc' ? 1 : -1;
    return [...linhas].sort(
      (a, b) => fator * compararLinhas(a, b, coluna) || a.nome.localeCompare(b.nome, 'pt-BR'),
    );
  });

  protected readonly leituraGrupos = computed(
    () => this.ultimaRede()?.meta?.leituraGrupos?.texto ?? '',
  );

  protected readonly comunidades = computed(() => {
    const rede = this.ultimaRede();
    const catalogo = valorDe(this.catalogoRecurso);
    if (!rede || !catalogo) return { grupos: [], isolados: 0 };
    return resumirComunidades(
      rede.nos,
      (institutoId) =>
        catalogo.institutos.find((instituto) => instituto.id === institutoId)?.sigla ?? institutoId,
    );
  });

  protected readonly pessoa = computed(() => {
    const foco = this.foco();
    if (foco?.tipo !== 'pessoa') return null;
    return this.ultimaRede()?.nos.find((no) => no.id === foco.id) ?? null;
  });

  protected readonly grupoAberto = computed(() => {
    const foco = this.foco();
    if (foco?.tipo !== 'comunidade') return null;
    return this.comunidades().grupos.find((grupo) => grupo.indice === foco.indice) ?? null;
  });

  protected readonly institutoAberto = computed(() => {
    const foco = this.foco();
    const catalogo = valorDe(this.catalogoRecurso);
    if (foco?.tipo !== 'instituto' || !catalogo) return null;
    const instituto = catalogo.institutos.find((item) => item.id === foco.id);
    if (!instituto) return null;
    const pessoas = this.ultimaRede()?.nos.filter((no) => no.institutoId === foco.id).length ?? 0;
    return { sigla: instituto.sigla, nome: instituto.nome, pessoas };
  });

  protected readonly gruposOutros = computed(() =>
    this.comunidades().grupos.filter((grupo) => grupo.indice >= SLOTS_REDE.length),
  );

  protected ordemDe(coluna: ColunaTabela): 'ascending' | 'descending' | 'none' {
    const atual = this.ordenacao();
    if (atual.coluna !== coluna) return 'none';
    return atual.direcao === 'asc' ? 'ascending' : 'descending';
  }

  protected ordenar(coluna: ColunaTabela): void {
    const atual = this.ordenacao();
    if (atual.coluna === coluna) {
      this.ordenacao.set({ coluna, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' });
      return;
    }
    const numerica = COLUNAS_TABELA.find((item) => item.id === coluna)?.numerica ?? false;
    this.ordenacao.set({ coluna, direcao: numerica ? 'desc' : 'asc' });
  }

  protected nomeInstituto(no: NoRede): string {
    const catalogo = valorDe(this.catalogoRecurso);
    return (
      catalogo?.institutos.find((instituto) => instituto.id === no.institutoId)?.nome ??
      no.institutoId
    );
  }

  protected siglaInstituto(no: NoRede): string {
    const catalogo = valorDe(this.catalogoRecurso);
    return (
      catalogo?.institutos.find((instituto) => instituto.id === no.institutoId)?.sigla ??
      no.institutoId
    );
  }

  protected textoGrupo(no: NoRede): string {
    const grupo = this.comunidades().grupos.find((item) => item.indice === no.comunidade);
    return grupo ? descreverGrupo(grupo) : `Grupo ${no.comunidade + 1}.`;
  }

  protected descrever(grupo: ResumoComunidade): string {
    return descreverGrupo(grupo);
  }

  protected selecionarPessoa(id: string): void {
    const no = this.ultimaRede()?.nos.find((item) => item.id === id) ?? null;
    this.foco.set(no ? { tipo: 'pessoa', id } : null);
    this.noSelecionado.emit(no);
  }

  protected abrirComunidade(indice: number): void {
    this.foco.set({ tipo: 'comunidade', indice });
    this.noSelecionado.emit(null);
  }

  protected clicarLegenda(item: ItemLegenda): void {
    if (item.comunidade !== undefined) {
      this.abrirComunidade(item.comunidade);
      return;
    }
    if (item.outros) {
      this.foco.set({ tipo: 'outros' });
      this.noSelecionado.emit(null);
      return;
    }
    if (item.institutoId) {
      this.foco.set({ tipo: 'instituto', id: item.institutoId });
      this.noSelecionado.emit(null);
    }
  }

  protected limparFoco(): void {
    this.foco.set(null);
    this.noSelecionado.emit(null);
  }

  protected comunidadePressionada(indice: number): boolean {
    const foco = this.foco();
    return foco?.tipo === 'comunidade' && foco.indice === indice;
  }

  protected legendaPressionada(item: ItemLegenda): boolean {
    const foco = this.foco();
    if (!foco) return false;
    if (foco.tipo === 'comunidade') return item.comunidade === foco.indice;
    if (foco.tipo === 'instituto') return item.institutoId === foco.id;
    return foco.tipo === 'outros' && item.outros === true;
  }

  protected parceirosFora(no: NoRede): string {
    if (no.vizinhosFora === undefined) return '—';
    return `${no.vizinhosFora} de ${no.grau}`;
  }

  protected institutosDoGrupo(no: NoRede): string {
    return no.institutosDoGrupo?.length ? no.institutosDoGrupo.join(', ') : '—';
  }

  constructor() {
    afterRenderEffect(() => {
      const modelo = this.modelo();
      const host = this.host()?.nativeElement;
      if (modelo && host) this.sincronizar(host, modelo);
    });

    afterRenderEffect(() => {
      if (this.exibicao() === 'grafico') this.enquadrarQuandoVisivel();
    });

    afterRenderEffect(() => {
      this.aplicarDestaque(this.foco());
    });

    this.destruicao.onDestroy(() => {
      cancelAnimationFrame(this.quadro);
      this.observador?.disconnect();
      this.grafo?.destroy();
    });
  }

  protected recarregar(): void {
    this.redeRecurso.reload();
    this.catalogoRecurso.reload();
  }

  private sincronizar(host: HTMLElement, modelo: ModeloRede): void {
    if (!this.grafo) {
      const grafo = this.criarGrafo({
        container: host,
        elements: modelo.elementos,
        style: modelo.estilo,
        layout: modelo.layout,
        minZoom: 0.05,
        maxZoom: 8,
      });
      grafo.on('tap', 'node', (evento: EventObject) => {
        const alvo = evento.target as NodeSingular;
        this.selecionarPessoa(alvo.id());
      });
      grafo.on('tap', (evento: EventObject) => {
        if (evento.target === grafo) this.limparFoco();
      });
      grafo.on('mouseover', 'node', (evento: EventObject) => {
        const alvo = evento.target as NodeSingular;
        const posicao = evento.renderedPosition ?? { x: 0, y: 0 };
        this.tooltip.set({
          x: posicao.x,
          y: posicao.y,
          texto: `${alvo.data('nome')} · ${alvo.data('instituto')} · Grupo ${alvo.data('grupo')} · ${alvo.data('grau')} parceiros`,
        });
      });
      grafo.on('mouseout', 'node', () => this.tooltip.set(null));
      grafo.on('mouseover', 'edge', (evento: EventObject) => {
        const peso = evento.target.data('peso') as number;
        const posicao = evento.renderedPosition ?? { x: 0, y: 0 };
        this.tooltip.set({
          x: posicao.x,
          y: posicao.y,
          texto: `Peso: ${peso.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}`,
        });
      });
      grafo.on('mouseout', 'edge', () => this.tooltip.set(null));
      this.grafo = grafo;
      this.observarTamanho(host);
      this.enquadrarQuandoVisivel();
      return;
    }
    this.limparFoco();
    this.tooltip.set(null);
    this.tamanhoAjustado = '';
    this.grafo.batch(() => {
      this.grafo!.elements().remove();
      this.grafo!.add(modelo.elementos);
    });
    this.grafo.style(modelo.estilo);
    this.grafo.layout(modelo.layout).run();
    this.enquadrarQuandoVisivel();
  }

  // O canvas mede a coluna antes do sidenav terminar. Sem um novo enquadramento,
  // a rede fica num canto e o restante da tela parece vazio.
  private observarTamanho(host: HTMLElement): void {
    if (this.observador || typeof ResizeObserver === 'undefined') return;
    this.observador = new ResizeObserver(() => {
      cancelAnimationFrame(this.quadro);
      this.quadro = requestAnimationFrame(() => this.enquadrarQuandoVisivel());
    });
    this.observador.observe(host);
  }

  private enquadrarQuandoVisivel(): void {
    const grafo = this.grafo;
    const host = this.host()?.nativeElement;
    if (!grafo || !host || this.exibicao() !== 'grafico') return;
    const largura = host.clientWidth;
    const altura = host.clientHeight;
    if (largura < 2 || altura < 2) {
      this.tamanhoAjustado = '';
      return;
    }
    const chave = `${largura}x${altura}`;
    if (chave === this.tamanhoAjustado) return;
    this.tamanhoAjustado = chave;
    grafo.resize();
    grafo.fit(undefined, 24);
  }

  private aplicarDestaque(foco: FocoGrafo | null): void {
    const grafo = this.grafo;
    if (!grafo) return;
    grafo.batch(() => {
      grafo.elements().removeClass('apagado destaque');
      if (!foco || foco.tipo === 'outros') return;
      if (foco.tipo === 'pessoa') {
        const alvo = grafo.$id(foco.id);
        if (alvo.empty()) return;
        grafo.elements().addClass('apagado');
        alvo.removeClass('apagado').addClass('destaque');
        alvo.neighborhood().removeClass('apagado');
        return;
      }
      const membros = grafo
        .nodes()
        .filter((no) =>
          foco.tipo === 'comunidade'
            ? no.data('comunidade') === foco.indice
            : no.data('institutoId') === foco.id,
        );
      if (membros.empty()) return;
      grafo.elements().addClass('apagado');
      membros.removeClass('apagado').addClass('destaque');
      membros.connectedEdges().forEach((aresta) => {
        const mesmaOrigem =
          foco.tipo === 'comunidade'
            ? aresta.source().data('comunidade') === foco.indice &&
              aresta.target().data('comunidade') === foco.indice
            : aresta.source().data('institutoId') === foco.id &&
              aresta.target().data('institutoId') === foco.id;
        if (mesmaOrigem) aresta.removeClass('apagado');
      });
    });
  }
}
