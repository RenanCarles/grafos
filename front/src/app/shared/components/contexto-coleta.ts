import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { METADADOS_REPOSITORY } from '@app/core/repositorios';
import { mensagemDe } from '@app/shared/util/mensagem-de-erro';
import { criarFiltrosPadrao, type FiltrosVisao } from '@app/shared/models/visao';
import { ANO_REFERENCIA_PADRAO, LAMBDA_PADRAO } from '@app/shared/models/peso';

@Component({
  selector: 'app-contexto-coleta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (recurso.hasValue()) {
      <p>
        Fontes: {{ recurso.value().fonteNos }} · {{ recurso.value().fonteArestas }}. Período da
        coleta: {{ recurso.value().anos }}. Relação disponível: coautoria.
      </p>
    } @else if (recurso.error()) {
      <p role="alert">
        {{ erro() }} <button type="button" (click)="recurso.reload()">Tentar novamente</button>
      </p>
    } @else {
      <p role="status">Carregando informações da coleta…</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    p {
      color: var(--viz-ink-2);
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `,
})
export class ContextoColeta {
  readonly filtros = input<FiltrosVisao>(criarFiltrosPadrao());
  private readonly repositorio = inject(METADADOS_REPOSITORY);
  protected readonly parametros = computed(
    () => ({
      formulaPeso: this.filtros().formulaPeso ?? 'reimberg',
      lambdaTemporal: this.filtros().lambdaTemporal ?? LAMBDA_PADRAO,
      anoReferencia: this.filtros().anoReferencia ?? ANO_REFERENCIA_PADRAO,
    }),
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );
  protected readonly recurso = rxResource({
    params: () => this.parametros(),
    stream: ({ params }) => this.repositorio.obterMetadados(params),
  });
  protected readonly erro = computed(() => mensagemDe(this.recurso.error()));
}
