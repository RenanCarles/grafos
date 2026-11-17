import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { montarCardsAreas } from '@app/features/areas-pesquisa/services/montar-cards-areas';
import { AreasPesquisa } from '@app/features/areas-pesquisa/components/areas-pesquisa/areas-pesquisa';
import { RedeColaboracao } from '@app/features/rede-colaboracao/components/rede-colaboracao/rede-colaboracao';
import {
  montarCardsRede,
  type EntradaCardsRede,
} from '@app/features/rede-colaboracao/services/montar-cards-rede';
import type { DadosAreas, NoRede } from '@app/shared/models/dominio';
import type { CardMetrica } from '@app/shared/models/card-metrica';
import type { RascunhoVisao } from '@app/shared/models/visao';
import { ContextoColeta } from '@app/shared/components/contexto-coleta';
import { CarrosselMetricas } from '../carrossel-metricas/carrossel-metricas';

@Component({
  selector: 'app-visualizacao-visao',
  imports: [RedeColaboracao, AreasPesquisa, ContextoColeta, CarrosselMetricas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-contexto-coleta [filtros]="visao().filtros" />
    @if (mostrarMetricas()) {
      <app-carrossel-metricas [cards]="cards()" />
    }
    @if (rede(); as r) {
      <app-rede-colaboracao
        [filtros]="r.filtros"
        [config]="r.config"
        [(grupoSelecionado)]="grupoSelecionado"
        (noSelecionado)="noSelecionado.emit($event)"
        (dadosCarregados)="aoCarregarRede($event)"
      />
    } @else if (areas(); as a) {
      <app-areas-pesquisa
        [filtros]="a.filtros"
        [config]="a.config"
        (dadosCarregados)="aoCarregarAreas($event)"
      />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      height: 100%;
    }
    :host > app-contexto-coleta,
    :host > app-carrossel-metricas {
      flex: none;
    }
    :host > app-rede-colaboracao,
    :host > app-areas-pesquisa {
      flex: 1 1 auto;
      min-width: 0;
      min-height: 0;
    }
  `,
})
export class VisualizacaoVisao {
  readonly visao = input.required<RascunhoVisao>();
  readonly mostrarMetricas = input(true);
  readonly noSelecionado = output<NoRede | null>();
  readonly grupoSelecionado = model<number | null>(null);
  readonly redeCarregada = output<EntradaCardsRede>();

  private readonly cardsRede = signal<CardMetrica[]>([]);
  private readonly cardsAreas = signal<CardMetrica[]>([]);

  protected readonly cards = computed(() =>
    this.visao().tipo === 'rede' ? this.cardsRede() : this.cardsAreas(),
  );

  protected readonly rede = computed(() => {
    const visao = this.visao();
    return visao.tipo === 'rede' ? visao : null;
  });

  protected readonly areas = computed(() => {
    const visao = this.visao();
    return visao.tipo === 'areas' ? visao : null;
  });

  protected aoCarregarRede(entrada: EntradaCardsRede): void {
    this.cardsRede.set(montarCardsRede(entrada));
    this.redeCarregada.emit(entrada);
  }

  protected aoCarregarAreas(dados: DadosAreas): void {
    this.cardsAreas.set(montarCardsAreas(dados));
  }
}
