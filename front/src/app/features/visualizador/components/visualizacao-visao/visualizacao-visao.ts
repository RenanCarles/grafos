import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AreasPesquisa } from '@app/features/areas-pesquisa/components/areas-pesquisa/areas-pesquisa';
import { RedeColaboracao } from '@app/features/rede-colaboracao/components/rede-colaboracao/rede-colaboracao';
import type { NoRede } from '@app/shared/models/dominio';
import type { RascunhoVisao } from '@app/shared/models/visao';

@Component({
  selector: 'app-visualizacao-visao',
  imports: [RedeColaboracao, AreasPesquisa],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rede(); as r) {
      <app-rede-colaboracao [filtros]="r.filtros" [config]="r.config" (noSelecionado)="noSelecionado.emit($event)" />
    } @else if (areas(); as a) {
      <app-areas-pesquisa [filtros]="a.filtros" [config]="a.config" />
    }
  `,
  styles: `:host { display: block; }`,
})
export class VisualizacaoVisao {
  readonly visao = input.required<RascunhoVisao>();
  readonly noSelecionado = output<NoRede | null>();

  protected readonly rede = computed(() => {
    const visao = this.visao();
    return visao.tipo === 'rede' ? visao : null;
  });

  protected readonly areas = computed(() => {
    const visao = this.visao();
    return visao.tipo === 'areas' ? visao : null;
  });
}
