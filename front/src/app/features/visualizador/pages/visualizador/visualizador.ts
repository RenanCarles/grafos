import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { VISOES_REPOSITORY } from '@app/core/repositorios';
import type { EntradaCardsRede } from '@app/features/rede-colaboracao/services/montar-cards-rede';
import { EstadoPagina, type EstadoCarga } from '@app/shared/components/estado-pagina';
import type { NoRede } from '@app/shared/models/dominio';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';
import { valorDe } from '@app/shared/util/recurso';
import { PainelComunidades } from '../../components/painel-comunidades/painel-comunidades';
import { PainelPesquisador } from '../../components/painel-pesquisador/painel-pesquisador';
import { VisualizacaoVisao } from '../../components/visualizacao-visao/visualizacao-visao';

@Component({
  selector: 'app-visualizador',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    EstadoPagina,
    VisualizacaoVisao,
    PainelPesquisador,
    PainelComunidades,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visualizador.html',
  styleUrl: './visualizador.scss',
})
export class Visualizador {
  readonly id = input.required<string>();

  private readonly repositorio = inject(VISOES_REPOSITORY);

  private readonly recurso = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.repositorio.obter(params),
  });

  protected readonly visao = computed(() => valorDe(this.recurso));
  protected readonly estado = computed<EstadoCarga>(() => {
    if (this.recurso.error()) return 'erro';
    return this.visao() ? 'pronto' : 'carregando';
  });
  protected readonly mensagemErro = computed(() => mensagemDe(this.recurso.error()));
  protected readonly noSelecionado = linkedSignal<string, NoRede | null>({
    source: this.id,
    computation: () => null,
  });
  protected readonly redeCarregada = linkedSignal<string, EntradaCardsRede | null>({
    source: this.id,
    computation: () => null,
  });
  protected readonly grupoSelecionado = linkedSignal<string, number | null>({
    source: this.id,
    computation: () => null,
  });

  protected recarregar(): void {
    this.recurso.reload();
  }
}
