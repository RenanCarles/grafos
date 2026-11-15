import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CATALOGO_REPOSITORY } from '@app/core/repositorios';
import { SIGNIFICADO_COMUNIDADE } from '@app/features/rede-colaboracao/services/resumir-comunidades';
import type { NoRede } from '@app/shared/models/dominio';

@Component({
  selector: 'app-painel-pesquisador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (no(); as n) {
      <h2>{{ n.nome }}</h2>
      <dl>
        <dt>Instituto</dt>
        <dd>{{ instituto() }}</dd>
        <dt>Áreas</dt>
        <dd>{{ areas() }}</dd>
        <dt>Parceiros (grau)</dt>
        <dd>{{ n.grau }}</dd>
        <dt>Força (soma dos pesos)</dt>
        <dd>{{ n.forca === undefined ? '—' : n.forca.toFixed(3) }}</dd>
        <dt>Intermediação</dt>
        <dd>{{ n.intermediacao.toFixed(3) }}</dd>
        <dt>Intermediação ponderada (distância = 1/peso)</dt>
        <dd>
          {{ n.intermediacaoPonderada === undefined ? '—' : n.intermediacaoPonderada.toFixed(6) }}
        </dd>
        <dt>Grupo de colaboração</dt>
        <dd>{{ n.comunidade + 1 }}</dd>
        <dt>Parceiros em outro instituto</dt>
        <dd>{{ parceirosFora() }}</dd>
        <dt>Institutos neste grupo</dt>
        <dd>{{ institutosDoGrupo() }}</dd>
      </dl>
      <p class="nota">{{ significadoComunidade }}</p>
    } @else {
      <p class="vazio">Selecione um pesquisador no grafo ou na tabela para ver os detalhes.</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 1.05rem;
    }
    dl {
      margin: 0;
      display: grid;
      gap: 2px;
    }
    dt {
      margin-top: 10px;
      color: var(--viz-ink-2);
      font-size: 0.8125rem;
    }
    dd {
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .vazio,
    .nota {
      margin: 12px 0 0;
      color: var(--viz-ink-2);
      font-size: 0.8125rem;
      line-height: 1.45;
    }
    .vazio {
      margin: 0;
    }
  `,
})
export class PainelPesquisador {
  readonly no = input<NoRede | null>(null);
  protected readonly significadoComunidade = SIGNIFICADO_COMUNIDADE;

  private readonly catalogo = toSignal(
    inject(CATALOGO_REPOSITORY)
      .obterCatalogo()
      .pipe(catchError(() => of(undefined))),
  );

  protected readonly instituto = computed(() => {
    const no = this.no();
    const catalogo = this.catalogo();
    if (!no || !catalogo) return '';
    return catalogo.institutos.find((i) => i.id === no.institutoId)?.nome ?? no.institutoId;
  });

  protected readonly areas = computed(() => {
    const no = this.no();
    const catalogo = this.catalogo();
    if (!no || !catalogo) return '';
    return (
      no.areaIds.map((id) => catalogo.areas.find((a) => a.id === id)?.nome ?? id).join(', ') ||
      'Não disponível nesta coleta'
    );
  });

  protected readonly parceirosFora = computed(() => {
    const no = this.no();
    if (!no || no.vizinhosFora === undefined) return '—';
    return `${no.vizinhosFora} de ${no.grau}`;
  });

  protected readonly institutosDoGrupo = computed(() => {
    const lista = this.no()?.institutosDoGrupo;
    return lista?.length ? lista.join(', ') : '—';
  });
}
