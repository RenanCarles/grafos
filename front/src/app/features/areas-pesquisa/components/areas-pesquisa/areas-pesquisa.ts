import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { AREAS_REPOSITORY } from '@app/core/repositorios';
import { TemaService } from '@app/core/tema.service';
import { EstadoPagina, type EstadoCarga } from '@app/shared/components/estado-pagina';
import type { DadosAreas } from '@app/shared/models/dominio';
import type { ConfigAreas, FiltrosVisao } from '@app/shared/models/visao';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';
import { valorDe } from '@app/shared/util/recurso';
import { montarModeloAreas, type ModeloAreas } from '../../services/montar-modelo-areas';

@Component({
  selector: 'app-areas-pesquisa',
  imports: [MatButtonToggleModule, NgxEchartsDirective, EstadoPagina],
  providers: [
    provideEchartsCore({ echarts: () => import('../../echarts-setup').then((m) => m.echarts) }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './areas-pesquisa.html',
  styleUrl: './areas-pesquisa.scss',
})
export class AreasPesquisa {
  readonly filtros = input.required<FiltrosVisao>();
  readonly config = input.required<ConfigAreas>();
  readonly dadosCarregados = output<DadosAreas>();

  private readonly repositorio = inject(AREAS_REPOSITORY);
  private readonly tema = inject(TemaService);

  protected readonly exibicao = signal<'grafico' | 'tabela'>('grafico');

  private readonly filtrosEstaveis = computed(() => this.filtros(), {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });

  private readonly recurso = rxResource({
    params: () => this.filtrosEstaveis(),
    stream: ({ params }) => this.repositorio.obterAreas(params),
  });

  private readonly ultimosDados = linkedSignal<DadosAreas | undefined, DadosAreas | undefined>({
    source: () => valorDe(this.recurso),
    computation: (atual, anterior) => atual ?? anterior?.value,
  });

  protected readonly mensagemErro = computed(() => mensagemDe(this.recurso.error()));
  protected readonly estado = computed<EstadoCarga>(() => {
    if (this.recurso.error()) return 'erro';
    return this.ultimosDados() ? 'pronto' : 'carregando';
  });
  protected readonly recarregando = computed(
    () => this.recurso.isLoading() && this.ultimosDados() !== undefined,
  );

  protected readonly modelo = computed<ModeloAreas | null>(() => {
    const dados = this.ultimosDados();
    return dados
      ? montarModeloAreas({ dados, config: this.config(), modo: this.tema.modo() })
      : null;
  });
  protected readonly vazio = computed(() => this.modelo()?.vazio === true);
  protected readonly semAreas = computed(() => this.ultimosDados()?.areas.length === 0);
  protected readonly mostrarEstado = computed(() => this.estado() !== 'pronto' || this.vazio());

  constructor() {
    effect(() => {
      const dados = this.ultimosDados();
      if (dados) this.dadosCarregados.emit(dados);
    });
  }

  protected recarregar(): void {
    this.recurso.reload();
  }
}
