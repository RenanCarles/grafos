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
import { FABRICA_CYTOSCAPE } from '../../services/fabrica-cytoscape';
import { montarModeloRede, type ModeloRede } from '../../services/montar-modelo-rede';

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

  protected readonly exibicao = signal<'grafico' | 'tabela'>('grafico');
  protected readonly tooltip = signal<{ x: number; y: number; texto: string } | null>(null);

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

  protected readonly erro = computed(() => this.redeRecurso.error() ?? this.catalogoRecurso.error());
  protected readonly mensagemErro = computed(() => mensagemDe(this.erro()));
  protected readonly estado = computed<EstadoCarga>(() => {
    if (this.erro()) return 'erro';
    return this.ultimaRede() && this.catalogoRecurso.hasValue() ? 'pronto' : 'carregando';
  });
  protected readonly recarregando = computed(
    () => this.redeRecurso.isLoading() && this.ultimaRede() !== undefined,
  );
  protected readonly vazio = computed(() => this.ultimaRede()?.nos.length === 0);
  protected readonly mostrarEstado = computed(() => this.estado() !== 'pronto' || this.vazio());

  protected readonly modelo = computed<ModeloRede | null>(() => {
    const rede = this.ultimaRede();
    const catalogo = valorDe(this.catalogoRecurso);
    return rede && catalogo
      ? montarModeloRede({ rede, catalogo, config: this.config(), modo: this.tema.modo() })
      : null;
  });

  constructor() {
    afterRenderEffect(() => {
      const modelo = this.modelo();
      const host = this.host()?.nativeElement;
      if (modelo && host) this.sincronizar(host, modelo);
    });

    afterRenderEffect(() => {
      if (this.exibicao() === 'grafico') {
        this.grafo?.resize();
        this.grafo?.fit(undefined, 30);
      }
    });

    this.destruicao.onDestroy(() => this.grafo?.destroy());
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
        minZoom: 0.3,
        maxZoom: 3,
      });
      grafo.on('tap', 'node', (evento: EventObject) => {
        const alvo = evento.target as NodeSingular;
        this.noSelecionado.emit(this.ultimaRede()?.nos.find((no) => no.id === alvo.id()) ?? null);
      });
      grafo.on('tap', (evento: EventObject) => {
        if (evento.target === grafo) this.noSelecionado.emit(null);
      });
      grafo.on('mouseover', 'node', (evento: EventObject) => {
        const alvo = evento.target as NodeSingular;
        const posicao = evento.renderedPosition ?? { x: 0, y: 0 };
        this.tooltip.set({ x: posicao.x, y: posicao.y, texto: `${alvo.data('nome')} · ${alvo.data('grau')} parceiros` });
      });
      grafo.on('mouseout', 'node', () => this.tooltip.set(null));
      this.grafo = grafo;
      return;
    }
    this.noSelecionado.emit(null);
    this.tooltip.set(null);
    this.grafo.batch(() => {
      this.grafo!.elements().remove();
      this.grafo!.add(modelo.elementos);
    });
    this.grafo.style(modelo.estilo);
    this.grafo.layout(modelo.layout).run();
  }
}
